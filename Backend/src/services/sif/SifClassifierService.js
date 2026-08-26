import { getGenerativeModel } from "../../config/ai.js";
import { SIF_CLASSIFICATION_SYSTEM_PROMPT, createSifUserPrompt } from "../../prompts/sifClassification.prompt.js";
import { sifClassificationSchema } from "../../validators/sif.validator.js";
import { GeminiService } from "../ai/GeminiService.js";
import { AppError } from "../../utils/appError.js";
import { logger } from "../../utils/logger.js";

export class SifClassifierService {
  /**
   * Deterministic rule-based SIF classifier fallback.
   */
  static evaluateDeterministicSif(report, nlpExtraction = {}) {
    const text = (report.originalContent || report.normalizedReport?.description || "").toLowerCase();
    
    // Check text length for ambiguity
    if (text.length < 25) {
      return {
        classification: "NEEDS_REVIEW",
        modelConfidence: 0.6,
        classificationReason: "Report description is too brief to definitively evaluate SIF potential without further investigation.",
        isHighPotentialEvent: false,
        decisionFactors: [
          { factor: "Information Completeness", presence: false, evidence: "Insufficient narrative detail" },
        ],
        actualVsPotentialDistinction: {
          actualOutcome: report.normalizedReport?.description || "Brief report",
          potentialOutcome: "Indeterminate without additional operational context.",
          divergenceReason: "Narrative brevity prevents unambiguous hazard and barrier assessment.",
        },
        supportingEvidence: [
          { text: text, justification: "Brief description requires human review" },
        ],
      };
    }

    const energySources = nlpExtraction.energySources || [];
    const barriers = nlpExtraction.barriers || [];
    const consequences = nlpExtraction.consequences || {};

    const hasUncontrolledHighEnergy = energySources.some(
      (e) => (e.magnitude === "HIGH" || e.magnitude === "MEDIUM") && !e.controlled
    );
    const hasFailedOrMissingBarrier = barriers.some(
      (b) => b.status === "FAILED" || b.status === "MISSING" || b.status === "DEGRADED"
    );
    const isFatalConsequence = consequences.potentialFatalities === true;

    // High energy keywords in text
    const hasHighEnergyText =
      text.includes("height") ||
      text.includes("fall") ||
      text.includes("scaffold") ||
      text.includes("ladder") ||
      text.includes("voltage") ||
      text.includes("electric") ||
      text.includes("440v") ||
      text.includes("11kv") ||
      text.includes("energ") ||
      text.includes("busbar") ||
      text.includes("switchboard") ||
      text.includes("pressure") ||
      text.includes("flange") ||
      text.includes("gas leak") ||
      text.includes("crane") ||
      text.includes("suspended load") ||
      text.includes("lifting") ||
      text.includes("confined space") ||
      text.includes("nitrogen") ||
      text.includes("h2s") ||
      text.includes("toxic") ||
      text.includes("fire") ||
      text.includes("explosion");

    const hasBarrierFailureText =
      text.includes("unhook") ||
      text.includes("without") ||
      text.includes("bypassed") ||
      text.includes("failed") ||
      text.includes("missing") ||
      text.includes("no permit") ||
      text.includes("not locked") ||
      text.includes("omitted") ||
      text.includes("not performed") ||
      text.includes("absent") ||
      text.includes("degraded");

    const isSif = (hasUncontrolledHighEnergy && hasFailedOrMissingBarrier) || isFatalConsequence || (hasHighEnergyText && hasBarrierFailureText);

    if (isSif) {
      return {
        classification: "SIF_POTENTIAL",
        modelConfidence: 0.91,
        classificationReason: "High-magnitude hazardous energy identified in combination with a failed or missing critical barrier, presenting high potential for life-altering injury or fatality.",
        isHighPotentialEvent: true,
        decisionFactors: [
          { factor: "Hazardous Energy Exposure", presence: true, evidence: energySources[0]?.type || "High Energy Source" },
          { factor: "Critical Barrier Failure", presence: true, evidence: barriers[0]?.name || "Safety Barrier Defect" },
        ],
        actualVsPotentialDistinction: {
          actualOutcome: nlpExtraction.actualOutcome || report.normalizedReport?.actualOutcome?.description || "Near miss / observation recorded without severe physical injury.",
          potentialOutcome: nlpExtraction.potentialOutcome || "Fatal or permanent disabling injury under slight variation in physical positioning or timing.",
          divergenceReason: "Luck, worker reflex, or secondary non-engineered factors prevented contact with full energy magnitude.",
        },
        supportingEvidence: [
          {
            text: text.substring(0, 160),
            justification: "Demonstrates active energy exposure with missing/failed barrier controls.",
          },
        ],
      };
    }

    return {
      classification: "NON_SIF",
      modelConfidence: 0.94,
      classificationReason: "Low hazard energy level and adequate protective controls in place; life-altering consequence physically improbable.",
      isHighPotentialEvent: false,
      decisionFactors: [
        { factor: "Hazardous Energy Exposure", presence: false, evidence: "Low or controlled energy" },
        { factor: "Critical Barrier Failure", presence: false, evidence: "Standard controls maintained" },
      ],
      actualVsPotentialDistinction: {
        actualOutcome: nlpExtraction.actualOutcome || "Minor observation / low-risk incident.",
        potentialOutcome: "First aid or minor occupational injury at most.",
        divergenceReason: "Energy involved lacked the physical threshold to inflict serious harm or death.",
      },
      supportingEvidence: [
        {
          text: text.substring(0, 160),
          justification: "Indicates low-consequence occupational observation.",
        },
      ],
    };
  }

  /**
   * Classify SIF potential using Gemini with validation and fallback.
   */
  static async classify(report, nlpExtraction = {}) {
    const model = getGenerativeModel(SIF_CLASSIFICATION_SYSTEM_PROMPT);

    if (!model) {
      logger.info(`Running deterministic SIF classification for report ${report.reportId}`);
      const fallbackResult = SifClassifierService.evaluateDeterministicSif(report, nlpExtraction);
      return sifClassificationSchema.parse(fallbackResult);
    }

    const userPrompt = createSifUserPrompt(report, nlpExtraction);
    let attempts = 0;
    const maxRetries = 3;

    while (attempts < maxRetries) {
      attempts++;
      try {
        logger.info(`Invoking Gemini SIF classification for report ${report.reportId} (Attempt ${attempts}/${maxRetries})`);
        const result = await model.generateContent(userPrompt);
        const responseText = result.response.text();
        const parsedJson = GeminiService.cleanAndParseJson(responseText);

        const validated = sifClassificationSchema.parse(parsedJson);
        logger.info(`Gemini SIF classification succeeded for ${report.reportId}: [${validated.classification}, confidence: ${validated.modelConfidence}]`);
        return validated;
      } catch (error) {
        logger.warn(`Gemini SIF classification attempt ${attempts} failed for ${report.reportId}: ${error.message}`);
        if (attempts >= maxRetries) {
          logger.error(`Exceeded maximum retries for SIF classification. Using deterministic fallback for ${report.reportId}.`);
          const fallback = SifClassifierService.evaluateDeterministicSif(report, nlpExtraction);
          return sifClassificationSchema.parse(fallback);
        }
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempts) * 500));
      }
    }
  }
}

export default SifClassifierService;
