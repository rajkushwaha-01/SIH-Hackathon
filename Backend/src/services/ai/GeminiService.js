import { getGenerativeModel } from "../../config/ai.js";
import { REPORT_EXTRACTION_SYSTEM_PROMPT, createExtractionUserPrompt } from "../../prompts/reportExtraction.prompt.js";
import { nlpExtractionSchema } from "../../validators/aiOutput.validator.js";
import { AppError } from "../../utils/appError.js";
import { logger } from "../../utils/logger.js";

export class GeminiService {
  /**
   * Helper to clean markdown code blocks from LLM responses and parse JSON.
   */
  static cleanAndParseJson(text = "") {
    try {
      let cleaned = text.trim();
      // Remove markdown ```json and ``` fences if present
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```\s*$/i, "");
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```\s*/i, "").replace(/```\s*$/i, "");
      }
      return JSON.parse(cleaned);
    } catch (parseError) {
      logger.error("Failed to parse Gemini JSON output:", text);
      throw new AppError("Malformed JSON output received from AI model", 502, "AI_INVALID_JSON_RESPONSE");
    }
  }

  /**
   * Deterministic fallback mock extraction for offline test mode or when Gemini is unconfigured.
   */
  static generateMockExtraction(report) {
    const text = (report.originalContent || report.normalizedReport?.description || "").toLowerCase();
    const isHeight = text.includes("height") || text.includes("scaffold") || text.includes("ladder") || text.includes("fall") || text.includes("harness");
    const isEnergy = text.includes("voltage") || text.includes("electric") || text.includes("energ") || text.includes("loto") || text.includes("breaker");
    const isPressure = text.includes("pressure") || text.includes("pipe") || text.includes("flange") || text.includes("gas") || text.includes("valve");
    const isConfined = text.includes("confined") || text.includes("tank") || text.includes("vessel");

    const hazards = [];
    const energySources = [];
    const barriers = [];

    if (isHeight) {
      hazards.push({ name: "Working at Height > 2m", category: "PHYSICAL", description: "Risk of fall from elevated platform or scaffold." });
      energySources.push({ type: "GRAVITY", magnitude: "HIGH", controlled: false });
      barriers.push({ name: "100% Fall Protection Harness & Lanyard", category: "PPE", status: text.includes("unhook") || text.includes("without") ? "MISSING" : "DEGRADED", evidenceText: "Fall protection was disconnected or not anchored." });
    }

    if (isEnergy) {
      hazards.push({ name: "Hazardous Electrical Energy", category: "ELECTRICAL", description: "Exposure to live electrical busbar or conductor." });
      energySources.push({ type: "ELECTRICAL", magnitude: "HIGH", controlled: false });
      barriers.push({ name: "Lockout / Tagout (LOTO) Zero Energy Verification", category: "ENGINEERING", status: "FAILED", evidenceText: "Zero energy verification multi-meter check was omitted." });
    }

    if (isPressure) {
      hazards.push({ name: "Pressurized Fluid / Hydrocarbon Release", category: "PROCESS_SAFETY", description: "Trapped pressure in line or vessel." });
      energySources.push({ type: "PRESSURE", magnitude: "HIGH", controlled: false });
      barriers.push({ name: "Line Bleed-Off & Pressure Depressurization", category: "ENGINEERING", status: "FAILED", evidenceText: "Flange unbolted under trapped pressure." });
    }

    if (isConfined) {
      hazards.push({ name: "Confined Space Atmospheric Hazard", category: "PROCESS_SAFETY", description: "Potential toxic gas or oxygen depletion." });
      energySources.push({ type: "CHEMICAL", magnitude: "HIGH", controlled: false });
      barriers.push({ name: "Continuous Atmospheric Gas Testing", category: "ENGINEERING", status: "MISSING", evidenceText: "Entry performed without multi-gas detector." });
    }

    if (hazards.length === 0) {
      hazards.push({ name: "General Workplace Hazard", category: "OCCUPATIONAL", description: "General slip, trip, or minor observation." });
      energySources.push({ type: "MECHANICAL", magnitude: "LOW", controlled: true });
      barriers.push({ name: "General Workplace Safety Inspection", category: "ADMINISTRATIVE", status: "PRESENT_EFFECTIVE", evidenceText: "Observation reported per housekeeping standard." });
    }

    return {
      activity: report.normalizedReport?.activity || "General Maintenance",
      location: report.normalizedReport?.location || "Main Plant Area",
      hazards,
      energySources,
      equipment: report.normalizedReport?.equipment?.length ? report.normalizedReport.equipment : ["General Equipment"],
      peopleInvolved: ["Technician", "Supervisor"],
      unsafeActs: text.includes("unhook") || text.includes("without") || text.includes("bypassed") ? ["Bypassing established safety procedure"] : [],
      unsafeConditions: text.includes("leak") || text.includes("pressure") || text.includes("damaged") ? ["Damaged or pressurized hardware"] : [],
      barriers,
      consequences: {
        potentialInjuries: isHeight || isEnergy || isPressure || isConfined ? ["Severe trauma", "Internal injuries", "Electrocution", "Asphyxiation"] : ["Minor contusion"],
        potentialFatalities: isHeight || isEnergy || isPressure || isConfined,
        worstCaseConsequence: isHeight || isEnergy || isPressure || isConfined ? "Serious Injury or Fatality (SIF)" : "First Aid Treatment",
      },
      actualOutcome: report.normalizedReport?.actualOutcome?.description || "Near miss / observation reported before harm occurred.",
      potentialOutcome: isHeight || isEnergy || isPressure || isConfined ? "High potential for serious injury or fatality." : "Low potential minor incident.",
      evidenceSnippets: [
        {
          text: (report.originalContent || report.normalizedReport?.description || "").substring(0, 150),
          section: "Event Description",
          supports: "Hazard and Barrier Failure Detection",
        },
      ],
    };
  }

  /**
   * Execute extraction prompt with Gemini and validate structured output.
   */
  static async extractReportIntelligence(report) {
    const startTime = Date.now();
    const model = getGenerativeModel(REPORT_EXTRACTION_SYSTEM_PROMPT);

    // Throw error if Gemini client is unavailable (Rule 20: No Silent Fallback)
    if (!model) {
      throw new AppError(
        "Gemini AI client is not configured. Please ensure GOOGLE_API_KEY is set in your environment.",
        503,
        "AI_SERVICE_UNAVAILABLE"
      );
    }

    const userPrompt = createExtractionUserPrompt(report);
    let attempts = 0;
    const maxRetries = 3;

    while (attempts < maxRetries) {
      attempts++;
      try {
        logger.info(`Invoking Gemini extraction for report ${report.reportId} (Attempt ${attempts}/${maxRetries})`);
        
        const result = await model.generateContent(userPrompt);
        const responseText = result.response.text();
        const parsedJson = GeminiService.cleanAndParseJson(responseText);

        // Validate strictly with Zod schema
        const validatedData = nlpExtractionSchema.parse(parsedJson);
        const executionTimeMs = Date.now() - startTime;

        logger.info(`Gemini extraction succeeded for ${report.reportId} in ${executionTimeMs}ms`);

        return {
          data: validatedData,
          executionTimeMs,
          model: "gemini-2.5-flash",
        };
      } catch (error) {
        logger.warn(`Gemini extraction attempt ${attempts} failed for ${report.reportId}: ${error.message}`);
        
        if (attempts >= maxRetries) {
          logger.error(`Exceeded maximum retries (${maxRetries}) for report ${report.reportId}.`);
          throw new AppError(
            `Gemini AI extraction failed after ${maxRetries} attempts: ${error.message}`,
            502,
            "AI_EXTRACTION_FAILED"
          );
        }

        // Exponential backoff wait
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempts) * 500));
      }
    }
  }
}

export default GeminiService;
