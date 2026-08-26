import { getGenerativeModel } from "../../config/ai.js";
import { PRECURSOR_TAXONOMY, PRECURSOR_DEFINITIONS } from "../../constants/precursor.constants.js";
import { PRECURSOR_DETECTION_SYSTEM_PROMPT, createPrecursorUserPrompt } from "../../prompts/precursorDetection.prompt.js";
import { precursorDetectionOutputSchema } from "../../validators/precursor.validator.js";
import { GeminiService } from "../ai/GeminiService.js";
import { AppError } from "../../utils/appError.js";
import { logger } from "../../utils/logger.js";

export class PrecursorService {
  /**
   * Deterministic rule-based multi-precursor detector fallback.
   */
  static evaluateDeterministicPrecursors(report, nlpExtraction = {}) {
    const text = (report.originalContent || report.normalizedReport?.description || "").toLowerCase();
    const detectedPrecursors = [];
    const barrierSignals = [];

    // 1. WORKING_AT_HEIGHT
    if (text.includes("height") || text.includes("scaffold") || text.includes("ladder") || text.includes("fall") || text.includes("harness")) {
      detectedPrecursors.push({
        type: "WORKING_AT_HEIGHT",
        confidence: 0.94,
        severity: "CRITICAL",
        evidenceText: "Work at elevated elevation (>2m) with compromised or unhooked fall arrest system.",
        failedBarriers: ["100% Fall Protection Tie-Off", "Anchor Point Connection"],
        detectionReason: "Elevated work activity involving fall hazard.",
      });
      barrierSignals.push({
        barrierName: "100% Fall Arrest Harness",
        hierarchyLevel: "PPE",
        status: text.includes("unhook") || text.includes("without") ? "FAILED" : "DEGRADED",
        failureMode: "Lanyard was not continuously connected to approved anchor point.",
        evidenceText: "Worker unhooked harness during transition.",
      });
    }

    // 2. DROPPED_OBJECTS
    if (text.includes("drop") || text.includes("fell from") || text.includes("falling object") || text.includes("tool fell") || text.includes("wrench fell")) {
      detectedPrecursors.push({
        type: "DROPPED_OBJECTS",
        confidence: 0.91,
        severity: "HIGH",
        evidenceText: "Object or tool fell from height toward work area below.",
        failedBarriers: ["Tool Tethering / Lanyard", "Toe Boards / Drop Zone Netting"],
        detectionReason: "Unsecured tool or component dropped from height.",
      });
      barrierSignals.push({
        barrierName: "Tool Tethering Lanyard",
        hierarchyLevel: "ENGINEERING",
        status: "MISSING",
        failureMode: "Hand tools were not tethered to wrist or structure.",
        evidenceText: "Tool fell from elevated deck level.",
      });
    }

    // 3. ENERGY_EXPOSURE / ELECTRICAL_EXPOSURE / ISOLATION_FAILURE
    if (text.includes("voltage") || text.includes("electric") || text.includes("switchboard") || text.includes("busbar") || text.includes("440v") || text.includes("11kv")) {
      detectedPrecursors.push({
        type: "ELECTRICAL_EXPOSURE",
        confidence: 0.95,
        severity: "CRITICAL",
        evidenceText: "Exposure to energized electrical circuits or conductors.",
        failedBarriers: ["Zero Energy Verification", "LOTO Padlock Application"],
        detectionReason: "Work in proximity to live electrical conductors.",
      });
      detectedPrecursors.push({
        type: "ISOLATION_FAILURE",
        confidence: 0.92,
        severity: "CRITICAL",
        evidenceText: "Zero energy multi-meter verification test omitted before commencing maintenance.",
        failedBarriers: ["Isolation Certificate & Multi-meter Verification"],
        detectionReason: "Failure to establish and test zero electrical energy state.",
      });
      barrierSignals.push({
        barrierName: "Lockout / Tagout (LOTO)",
        hierarchyLevel: "ENGINEERING",
        status: "FAILED",
        failureMode: "Lockout padlocks and isolation tags not applied or verified.",
        evidenceText: "Equipment remained energized during panel access.",
      });
    }

    // 4. PRESSURE_RELEASE
    if (text.includes("pressure") || text.includes("flange") || text.includes("pipe") || text.includes("hydraulic") || text.includes("gasket blowout")) {
      detectedPrecursors.push({
        type: "PRESSURE_RELEASE",
        confidence: 0.9,
        severity: "HIGH",
        evidenceText: "Work on pressurized fluid or hydrocarbon containment system.",
        failedBarriers: ["Line Bleed-Off & Depressurization Verification"],
        detectionReason: "Trapped pressure release during mechanical unbolting.",
      });
      barrierSignals.push({
        barrierName: "Bleed-off & Venting Procedure",
        hierarchyLevel: "ENGINEERING",
        status: "FAILED",
        failureMode: "Depressurization valve was not checked before loosening bolts.",
        evidenceText: "Pressurized fluid escaped upon loosening flange.",
      });
    }

    // 5. CONFINED_SPACE & CHEMICAL_EXPOSURE
    if (text.includes("confined") || text.includes("tank") || text.includes("vessel") || text.includes("nitrogen") || text.includes("h2s") || text.includes("toxic")) {
      detectedPrecursors.push({
        type: "CONFINED_SPACE",
        confidence: 0.93,
        severity: "CRITICAL",
        evidenceText: "Entry into enclosed or hazardous atmosphere vessel.",
        failedBarriers: ["Atmospheric Gas Testing", "Standby Attendant"],
        detectionReason: "Vessel entry with restricted egress and hazardous atmosphere potential.",
      });
      if (text.includes("nitrogen") || text.includes("h2s") || text.includes("toxic") || text.includes("gas")) {
        detectedPrecursors.push({
          type: "CHEMICAL_EXPOSURE",
          confidence: 0.88,
          severity: "HIGH",
          evidenceText: "Potential toxic gas or asphyxiant atmosphere exposure.",
          failedBarriers: ["Continuous Gas Detector", "Breathing Apparatus"],
          detectionReason: "Presence of toxic or asphyxiant chemical agents.",
        });
      }
      barrierSignals.push({
        barrierName: "Atmospheric Multi-Gas Detector",
        hierarchyLevel: "ENGINEERING",
        status: "MISSING",
        failureMode: "Gas testing not performed prior to manway entry.",
        evidenceText: "Entry commenced without calibrated gas test sign-off.",
      });
    }

    // 6. LINE_OF_FIRE
    if (text.includes("line of fire") || text.includes("crane") || text.includes("suspended") || text.includes("pinch") || (detectedPrecursors.some((p) => p.type === "DROPPED_OBJECTS"))) {
      detectedPrecursors.push({
        type: "LINE_OF_FIRE",
        confidence: 0.87,
        severity: "HIGH",
        evidenceText: "Worker positioned in direct line of fire of falling tools or moving components.",
        failedBarriers: ["Physical Barricading & Safe Stand-off Exclusion Zone"],
        detectionReason: "Worker positioning directly beneath active overhead operations.",
      });
    }

    // Default general precursor if high energy is detected without specific category
    if (detectedPrecursors.length === 0 && (nlpExtraction.energySources?.some((e) => e.magnitude === "HIGH"))) {
      detectedPrecursors.push({
        type: "ENERGY_EXPOSURE",
        confidence: 0.85,
        severity: "HIGH",
        evidenceText: "General high magnitude energy exposure identified.",
        failedBarriers: ["General Isolation Control"],
        detectionReason: "Uncontrolled energy source present in work area.",
      });
    }

    return {
      detectedPrecursors,
      barrierSignals,
      primaryPrecursor: detectedPrecursors[0]?.type || "",
    };
  }

  /**
   * Detect precursors using Gemini with validation and fallback.
   */
  static async detectPrecursors(report, nlpExtraction = {}) {
    const model = getGenerativeModel(PRECURSOR_DETECTION_SYSTEM_PROMPT);

    if (!model) {
      logger.info(`Running deterministic Precursor detection for report ${report.reportId}`);
      const fallbackResult = PrecursorService.evaluateDeterministicPrecursors(report, nlpExtraction);
      return precursorDetectionOutputSchema.parse(fallbackResult);
    }

    const userPrompt = createPrecursorUserPrompt(report, nlpExtraction);
    let attempts = 0;
    const maxRetries = 3;

    while (attempts < maxRetries) {
      attempts++;
      try {
        logger.info(`Invoking Gemini Precursor detection for report ${report.reportId} (Attempt ${attempts}/${maxRetries})`);
        const result = await model.generateContent(userPrompt);
        const responseText = result.response.text();
        const parsedJson = GeminiService.cleanAndParseJson(responseText);

        const validated = precursorDetectionOutputSchema.parse(parsedJson);
        logger.info(`Gemini Precursor detection succeeded for ${report.reportId}: [Found ${validated.detectedPrecursors.length} precursors]`);
        return validated;
      } catch (error) {
        logger.warn(`Gemini Precursor detection attempt ${attempts} failed for ${report.reportId}: ${error.message}`);
        if (attempts >= maxRetries) {
          logger.error(`Exceeded maximum retries for Precursor detection. Using deterministic fallback for ${report.reportId}.`);
          const fallback = PrecursorService.evaluateDeterministicPrecursors(report, nlpExtraction);
          return precursorDetectionOutputSchema.parse(fallback);
        }
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempts) * 500));
      }
    }
  }

  /**
   * Return full 14 precursor taxonomy definitions.
   */
  static getTaxonomy() {
    return {
      count: PRECURSOR_TAXONOMY.length,
      taxonomy: PRECURSOR_DEFINITIONS,
      list: PRECURSOR_TAXONOMY,
    };
  }

  /**
   * Return metadata for a specific precursor type.
   */
  static getPrecursorByType(type = "") {
    const cleanType = type.toUpperCase().trim();
    const definition = PRECURSOR_DEFINITIONS[cleanType];
    if (!definition) {
      throw new AppError(`Precursor type '${type}' is not recognized in the 14-category taxonomy`, 404, "PRECURSOR_TYPE_NOT_FOUND");
    }
    return definition;
  }
}

export default PrecursorService;
