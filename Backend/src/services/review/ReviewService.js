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
   * Check if MongoDB is connected; throw error if offline (Rule 20: No Silent Fallback).
   */
  static verifyDbConnection() {
    if (mongoose.connection.readyState !== 1) {
      throw new AppError(
        "Database is offline or disconnected. Cannot query review records.",
        503,
        "DATABASE_DISCONNECTED"
      );
    }
  }

  /**
   * Assemble unified 360-degree report detail payload directly from MongoDB.
   */
  static async getReportDetail(reportId) {
    ReviewService.verifyDbConnection();

    const isObjectId = reportId.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { $or: [{ _id: reportId }, { reportId }] } : { reportId };
    const report = await SafetyReport.findOne(query);
    if (!report) {
      throw new AppError(`Safety report '${reportId}' not found in database`, 404, "REPORT_NOT_FOUND");
    }

    const canonicalReportId = report.reportId;
    const latestAnalysis = await Analysis.findOne({
      $or: [{ reportId: canonicalReportId }, { reportId }],
      isLatest: true,
    });
    const versionHistory = await Analysis.find({
      $or: [{ reportId: canonicalReportId }, { reportId }],
    }).sort({ version: -1 });
    const auditTrail = await AuditTrail.find({
      entityId: { $in: [canonicalReportId, reportId, report._id.toString()] },
    }).sort({ createdAt: -1 });
    const alerts = await Alert.find({
      sourceReportId: { $in: [canonicalReportId, reportId, report._id.toString()] },
    });

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
   * Submit human-in-the-loop review decision or override directly to MongoDB.
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
    ReviewService.verifyDbConnection();
    logger.info(`Processing HSE review for report ${reportId}: Decision = ${decision}`);

    const isObjectId = reportId.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { $or: [{ _id: reportId }, { reportId }] } : { reportId };
    const report = await SafetyReport.findOne(query);
    if (!report) {
      throw new AppError(`Safety report '${reportId}' not found`, 404, "REPORT_NOT_FOUND");
    }

    const canonicalReportId = report.reportId;
    const latestAnalysis = await Analysis.findOne({
      $or: [{ reportId: canonicalReportId }, { reportId }],
      isLatest: true,
    });
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
      const currentVerNum = parseInt(latestAnalysis.version?.replace?.("v", "") || "1", 10) || 1;
      const nextVersion = `v${currentVerNum + 1}`;

      // 3. Clone and apply overrides
      const updatedExtraction = JSON.parse(JSON.stringify(latestAnalysis.nlpExtraction || {}));
      let updatedPrecursors = JSON.parse(JSON.stringify(latestAnalysis.precursors || []));
      const updatedSif = JSON.parse(JSON.stringify(latestAnalysis.sifClassification || {}));

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
      if (!updatedExtraction.barriers) updatedExtraction.barriers = [];
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
        analysisId: `ANA-${canonicalReportId}-${nextVersion}`,
        reportId: canonicalReportId,
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

    // 5. Log audit trail entry in MongoDB
    const auditEntry = new AuditTrail({
      auditId,
      entityType: "REPORT",
      entityId: canonicalReportId,
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
      reportId: canonicalReportId,
      decision,
      reviewStatus: report.reviewStatus,
      activeVersion: newAnalysis.version,
      analysis: newAnalysis,
      auditEntry,
    };
  }

  /**
   * Retrieve chronological audit log for entity from MongoDB.
   */
  static async getAuditTrail(entityId) {
    ReviewService.verifyDbConnection();
    const isObjectId = entityId.match(/^[0-9a-fA-F]{24}$/);
    let canonicalId = entityId;
    if (isObjectId) {
      const report = await SafetyReport.findById(entityId);
      if (report) canonicalId = report.reportId;
    }
    return AuditTrail.find({ entityId: { $in: [canonicalId, entityId] } }).sort({ createdAt: -1 });
  }
}

export default ReviewService;
