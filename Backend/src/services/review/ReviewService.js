import mongoose from "mongoose";
import { SafetyReport } from "../../models/SafetyReport.js";
import { Analysis } from "../../models/Analysis.js";
import { AuditTrail } from "../../models/AuditTrail.js";
import { Alert } from "../../models/Alert.js";
import { RiskScoringEngine } from "../risk/RiskScoringEngine.js";
import { AppError } from "../../utils/appError.js";
import { logger } from "../../utils/logger.js";

export class ReviewService {
  /**
   * Assemble unified 360-degree report detail payload.
   */
  static async getReportDetail(reportId) {
    if (mongoose.connection.readyState !== 1) {
      return ReviewService.getMockReportDetail(reportId);
    }

    const report = await SafetyReport.findOne({ reportId });
    if (!report) {
      throw new AppError(`Safety report '${reportId}' not found`, 404, "REPORT_NOT_FOUND");
    }

    const latestAnalysis = await Analysis.findOne({ reportId, isLatest: true });
    const versionHistory = await Analysis.find({ reportId }).sort({ version: -1 });
    const auditTrail = await AuditTrail.find({ entityId: reportId }).sort({ createdAt: -1 });
    const alerts = await Alert.find({ sourceReportId: reportId });

    return {
      report,
      latestAnalysis,
      reviewStatus: report.reviewStatus || "PENDING_REVIEW",
      versionCount: versionHistory.length,
      versionHistory: versionHistory.map((v) => ({
        version: v.version,
        isLatest: v.isLatest,
        humanReviewed: v.humanReviewed,
        sifClassification: v.sifClassification?.classification,
        riskScore: v.riskScore?.score,
        createdAt: v.createdAt,
      })),
      auditTrail,
      alerts,
    };
  }

  /**
   * Submit human-in-the-loop review decision or override.
   */
  static async submitReview({
    reportId,
    decision,
    overrideSifClassification,
    overrideRiskScore,
    overridePrecursors = [],
    overrideBarriers = [],
    justification,
    user = null,
  } = {}) {
    logger.info(`Processing HSE review for report ${reportId}: Decision = ${decision}`);

    if (mongoose.connection.readyState !== 1) {
      return {
        reportId,
        decision,
        reviewStatus: decision === "APPROVE" ? "APPROVED" : decision === "REJECT" ? "REJECTED" : "OVERRIDDEN",
        justification,
        updatedAt: new Date(),
      };
    }

    const report = await SafetyReport.findOne({ reportId });
    if (!report) {
      throw new AppError(`Safety report '${reportId}' not found`, 404, "REPORT_NOT_FOUND");
    }

    const latestAnalysis = await Analysis.findOne({ reportId, isLatest: true });
    if (!latestAnalysis) {
      throw new AppError(`No active analysis found for report '${reportId}'`, 404, "ANALYSIS_NOT_FOUND");
    }

    const auditId = `AUD-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    let action = "HUMAN_REVIEW_APPROVED";
    let newAnalysis = latestAnalysis;

    if (decision === "APPROVE") {
      report.reviewStatus = "APPROVED";
      report.reviewedBy = user?._id || user?.id;
      report.reviewedAt = new Date();
      report.reviewNotes = justification;
      await report.save();

      latestAnalysis.humanReviewed = true;
      latestAnalysis.reviewedBy = user?._id || user?.id;
      latestAnalysis.reviewedAt = new Date();
      latestAnalysis.reviewNotes = justification;
      await latestAnalysis.save();

      action = "HUMAN_REVIEW_APPROVED";
    } else if (decision === "REJECT") {
      report.reviewStatus = "REJECTED";
      report.reviewedBy = user?._id || user?.id;
      report.reviewedAt = new Date();
      report.reviewNotes = justification;
      await report.save();

      action = "HUMAN_REVIEW_REJECTED";
    } else if (decision === "OVERRIDE") {
      // 1. Mark previous analysis as non-latest
      latestAnalysis.isLatest = false;
      await latestAnalysis.save();

      // 2. Compute next sequential version string (e.g. v1 -> v2)
      const currentVerNum = parseInt(latestAnalysis.version.replace("v", ""), 10) || 1;
      const nextVersion = `v${currentVerNum + 1}`;

      // 3. Clone and apply overrides
      const updatedExtraction = JSON.parse(JSON.stringify(latestAnalysis.nlpExtraction));
      let updatedPrecursors = JSON.parse(JSON.stringify(latestAnalysis.precursors));
      const updatedSif = JSON.parse(JSON.stringify(latestAnalysis.sifClassification));

      if (overrideSifClassification) {
        updatedSif.classification = overrideSifClassification;
        updatedSif.isHighPotentialEvent = overrideSifClassification === "SIF_POTENTIAL";
      }

      // Precursor overrides
      for (const pOverride of overridePrecursors) {
        if (pOverride.action === "REMOVE") {
          updatedPrecursors = updatedPrecursors.filter((p) => p.type !== pOverride.type);
        } else if (pOverride.action === "ADD") {
          if (!updatedPrecursors.some((p) => p.type === pOverride.type)) {
            updatedPrecursors.push({ type: pOverride.type, confidence: 1.0, humanOverridden: true });
          }
        }
      }

      // Barrier overrides
      for (const bOverride of overrideBarriers) {
        const barrier = updatedExtraction.barriers.find((b) => b.name.toLowerCase() === bOverride.name.toLowerCase());
        if (barrier) {
          barrier.status = bOverride.status;
        } else {
          updatedExtraction.barriers.push({
            name: bOverride.name,
            category: bOverride.category || "ENGINEERING",
            status: bOverride.status,
          });
        }
      }

      // Re-evaluate or manually set risk score
      let newRiskScore = null;
      if (typeof overrideRiskScore === "number") {
        newRiskScore = {
          score: overrideRiskScore,
          level: overrideRiskScore >= 80 ? "CRITICAL" : overrideRiskScore >= 50 ? "HIGH" : overrideRiskScore >= 20 ? "MEDIUM" : "LOW",
          dominantFactor: "Human HSE Officer Override",
        };
      } else {
        newRiskScore = RiskScoringEngine.calculateRiskScore({
          report,
          nlpExtraction: updatedExtraction,
          detectedPrecursors: updatedPrecursors,
          sifClassification: updatedSif,
        });
      }

      // 4. Create new versioned Analysis document
      newAnalysis = new Analysis({
        analysisId: `ANA-${report.reportId}-${nextVersion}`,
        reportId: report.reportId,
        version: nextVersion,
        isLatest: true,
        nlpExtraction: updatedExtraction,
        precursors: updatedPrecursors,
        sifClassification: updatedSif,
        riskScore: newRiskScore,
        lifeSavingRuleMappings: latestAnalysis.lifeSavingRuleMappings,
        humanReviewed: true,
        reviewedBy: user?._id || user?.id,
        reviewedAt: new Date(),
        reviewNotes: justification,
      });

      await newAnalysis.save();

      report.reviewStatus = "OVERRIDDEN";
      report.reviewedBy = user?._id || user?.id;
      report.reviewedAt = new Date();
      report.reviewNotes = justification;
      await report.save();

      action = "HUMAN_OVERRIDE_APPLIED";
    }

    // 5. Log audit trail entry
    const auditEntry = new AuditTrail({
      auditId,
      entityType: "REPORT",
      entityId: reportId,
      action,
      performedBy: user?._id || user?.id,
      performedByName: user?.name || "HSE Review Officer",
      performedByRole: user?.role || "HSE_OFFICER",
      previousState: {
        reviewStatus: report.reviewStatus,
        sifClassification: latestAnalysis.sifClassification?.classification,
        riskScore: latestAnalysis.riskScore?.score,
        version: latestAnalysis.version,
      },
      newState: {
        reviewStatus: report.reviewStatus,
        sifClassification: newAnalysis.sifClassification?.classification,
        riskScore: newAnalysis.riskScore?.score,
        version: newAnalysis.version,
      },
      justification,
    });

    await auditEntry.save();

    return {
      reportId,
      decision,
      reviewStatus: report.reviewStatus,
      activeVersion: newAnalysis.version,
      analysis: newAnalysis,
      auditEntry,
    };
  }

  /**
   * Retrieve chronological audit log for entity.
   */
  static async getAuditTrail(entityId) {
    if (mongoose.connection.readyState !== 1) {
      return [
        {
          auditId: "AUD-2026-0001",
          entityType: "REPORT",
          entityId,
          action: "AI_ANALYSIS_COMPLETED",
          performedByName: "Gemini AI NLP Pipeline",
          performedByRole: "SYSTEM",
          createdAt: new Date(),
        },
      ];
    }
    return AuditTrail.find({ entityId }).sort({ createdAt: -1 });
  }

  /**
   * Mock report detail for testing/offline mode.
   */
  static getMockReportDetail(reportId) {
    return {
      report: {
        reportId,
        title: "Mock Incident Report",
        reviewStatus: "PENDING_REVIEW",
      },
      latestAnalysis: {
        analysisId: `ANA-${reportId}-v1`,
        version: "v1",
        isLatest: true,
        humanReviewed: false,
        sifClassification: { classification: "SIF_POTENTIAL" },
        riskScore: { score: 75, level: "HIGH" },
      },
      reviewStatus: "PENDING_REVIEW",
      versionCount: 1,
      versionHistory: [{ version: "v1", isLatest: true, riskScore: 75 }],
      auditTrail: [
        {
          auditId: "AUD-2026-0001",
          action: "AI_ANALYSIS_COMPLETED",
          performedByName: "System AI Pipeline",
        },
      ],
      alerts: [],
    };
  }
}

export default ReviewService;
