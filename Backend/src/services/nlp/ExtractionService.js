import { SafetyReport } from "../../models/SafetyReport.js";
import { Evidence } from "../../models/Evidence.js";
import { Analysis } from "../../models/Analysis.js";
import { GeminiService } from "../ai/GeminiService.js";
import { SifClassifierService } from "../sif/SifClassifierService.js";
import { PrecursorService } from "../precursor/PrecursorService.js";
import { LifeSavingRulesService } from "../lifeSavingRules/LifeSavingRulesService.js";
import { RiskScoringEngine, RISK_ENGINE_VERSION } from "../risk/RiskScoringEngine.js";
import { AppError } from "../../utils/appError.js";
import { logger } from "../../utils/logger.js";

export class ExtractionService {
  /**
   * Execute NLP extraction, SIF classification, Precursor detection, IOGP Rule mapping,
   * deterministic risk scoring, and persist versioned intelligence.
   */
  static async extractAndPersist(reportId) {
    const report = await SafetyReport.findOne({ reportId });
    if (!report) {
      throw new AppError(`Report '${reportId}' not found for NLP extraction`, 404, "REPORT_NOT_FOUND");
    }

    logger.info(`Starting NLP extraction & deterministic Risk Engine for report: ${reportId}`);

    // 1. Call GeminiService for structured entity and barrier extraction
    const { data: extraction, executionTimeMs, model } = await GeminiService.extractReportIntelligence(report);

    // 2. Call SifClassifierService for SIF classification and actual vs potential evaluation
    const sifClassification = await SifClassifierService.classify(report, extraction);

    // 3. Call PrecursorService for multi-precursor and barrier signal detection
    const precursorResult = await PrecursorService.detectPrecursors(report, extraction);

    // 4. Call LifeSavingRulesService for deterministic IOGP Life-Saving Rule mapping
    const lsrMappings = LifeSavingRulesService.mapLifeSavingRules(
      report,
      extraction,
      precursorResult.detectedPrecursors
    );

    // 5. Call RiskScoringEngine for deterministic reproducible risk score calculation
    const deterministicRisk = RiskScoringEngine.calculateRiskScore({
      report,
      nlpExtraction: extraction,
      detectedPrecursors: precursorResult.detectedPrecursors,
      sifClassification,
    });

    // 6. Persist evidence snippets into Evidence collection
    const evidenceIds = [];
    if (extraction.evidenceSnippets && Array.isArray(extraction.evidenceSnippets)) {
      for (let i = 0; i < extraction.evidenceSnippets.length; i++) {
        const snippet = extraction.evidenceSnippets[i];
        const evidenceDoc = new Evidence({
          evidenceId: `EVD-${reportId}-${String(i + 1).padStart(2, "0")}`,
          reportId: report.reportId,
          sourceType: "REPORT_TEXT",
          text: snippet.text || report.normalizedReport.description,
          section: snippet.section || "Event Description",
          derivedConclusions: [
            {
              type: "SIF_CLASSIFICATION",
              value: sifClassification.classification,
            },
            {
              type: "PRECURSOR_DETECTION",
              value: precursorResult.detectedPrecursors.map((p) => p.type).join(", ") || "NONE",
            },
            {
              type: "IOGP_LSR_MAPPING",
              value: lsrMappings.map((r) => r.ruleName).join(", ") || "NONE",
            },
            {
              type: "RISK_SCORING",
              value: `Score: ${deterministicRisk.score} (${deterministicRisk.level})`,
            },
            {
              type: "NLP_EXTRACTION",
              value: snippet.supports || "Hazard & Barrier Identification",
            },
          ],
        });
        await evidenceDoc.save();
        evidenceIds.push(evidenceDoc._id);
      }
    }

    // 7. Versioning: Calculate new version number and mark previous analyses as isLatest: false
    const previousAnalyses = await Analysis.find({ reportId: report.reportId }).sort({ version: -1 });
    const nextVersion = previousAnalyses.length > 0 ? previousAnalyses[0].version + 1 : 1;

    if (previousAnalyses.length > 0) {
      await Analysis.updateMany({ reportId: report.reportId }, { isLatest: false });
    }

    const analysis = new Analysis({
      analysisId: `ANL-${report.reportId}-v${nextVersion}`,
      reportId: report.reportId,
      version: nextVersion,
      isLatest: true,
      aiMetadata: {
        model,
        promptVersion: "sif-risk-v2.0",
        taxonomyVersion: "precursor-14-v1.0",
        riskEngineVersion: RISK_ENGINE_VERSION,
        lifeSavingRulesVersion: "iogp-2020-v1.0",
        executionTimeMs,
      },
      nlpExtraction: extraction,
      sifClassification,
      precursors: precursorResult.detectedPrecursors.map((p) => ({
        type: p.type,
        confidence: p.confidence,
        severity: p.severity,
        evidenceText: p.evidenceText,
        failedBarriers: p.failedBarriers,
      })),
      lifeSavingRuleMappings: lsrMappings.map((m) => ({
        ruleId: m.ruleId,
        ruleName: m.ruleName,
        mappingReason: m.mappingReason,
        confidence: m.confidence,
        evidenceText: m.evidenceText,
      })),
      riskScore: {
        score: deterministicRisk.score,
        level: deterministicRisk.level,
        dominantFactor: deterministicRisk.dominantFactor,
        factors: deterministicRisk.factors,
      },
      priority: {
        level: deterministicRisk.level,
        reasons: deterministicRisk.factors.map((f) => f.reason),
      },
      recommendations: extraction.barriers
        .filter((b) => b.status === "FAILED" || b.status === "MISSING")
        .map((b) => ({
          action: `Restore and verify critical barrier: ${b.name}`,
          hierarchyLevel: b.category === "PPE" ? "PPE" : "ENGINEERING",
          targetBarrier: b.name,
        })),
      evidenceIds,
    });

    await analysis.save();

    // 8. Update SafetyReport status
    report.status = "ANALYZED";
    report.lastAnalyzedAt = new Date();
    await report.save();

    logger.info(
      `Analysis v${nextVersion} saved: ${analysis.analysisId} for report ${reportId} [Risk: ${deterministicRisk.score}/${deterministicRisk.level}]`
    );

    return {
      analysis,
      extraction,
      sifClassification,
      precursors: precursorResult.detectedPrecursors,
      lifeSavingRules: lsrMappings,
      riskScore: deterministicRisk,
      evidenceCount: evidenceIds.length,
    };
  }
}

export default ExtractionService;
