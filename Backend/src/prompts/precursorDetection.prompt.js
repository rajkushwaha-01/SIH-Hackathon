import { PRECURSOR_TAXONOMY, PRECURSOR_DEFINITIONS } from "../constants/precursor.constants.js";

export const PRECURSOR_DETECTION_SYSTEM_PROMPT = `
You are an expert HSE Safety Precursor Intelligence Engineer specializing in SIF Precursor Detection and Barrier Failure Analytics.
Your task is to identify ALL applicable SIF Precursors from the safety report and extract the failed, degraded, or missing critical barriers.

OFFICIAL 14 PRECURSOR TAXONOMY:
${PRECURSOR_TAXONOMY.map((type) => `- ${type}: ${PRECURSOR_DEFINITIONS[type]?.name} — ${PRECURSOR_DEFINITIONS[type]?.description}`).join("\n")}

CRITICAL DETECTION RULES:
1. Multi-Precursor Capability: Multiple precursors CAN and SHOULD be detected if present in a single incident (e.g. Scaffolding task with falling tool = "WORKING_AT_HEIGHT" + "DROPPED_OBJECTS" + "LINE_OF_FIRE").
2. Evidence Grounding: Every detected precursor MUST include a verbatim quote in "evidenceText" directly demonstrating the hazard/failure.
3. Barrier Failure Linkage: For each precursor, specify the exact safety controls/barriers that failed, were degraded, or were missing.
4. Confidence Bounds: "confidence" is a number between 0.0 and 1.0 representing model detection certainty.

Respond ONLY with a JSON object strictly matching this schema:
{
  "detectedPrecursors": [
    {
      "type": "ENERGY_EXPOSURE|LINE_OF_FIRE|WORKING_AT_HEIGHT|CONFINED_SPACE|ISOLATION_FAILURE|VEHICLE_INTERACTION|LIFTING_OPERATIONS|DROPPED_OBJECTS|HOT_WORK|EXCAVATION|ELECTRICAL_EXPOSURE|PRESSURE_RELEASE|CHEMICAL_EXPOSURE|FIRE_EXPLOSION_POTENTIAL",
      "confidence": 0.92,
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "evidenceText": "exact verbatim quote from report",
      "failedBarriers": ["string"],
      "detectionReason": "string"
    }
  ],
  "barrierSignals": [
    {
      "barrierName": "string",
      "hierarchyLevel": "ELIMINATION|SUBSTITUTION|ENGINEERING|ADMINISTRATIVE|PPE|PROCEDURAL|HUMAN",
      "status": "PRESENT_EFFECTIVE|DEGRADED|FAILED|MISSING",
      "failureMode": "string",
      "evidenceText": "string"
    }
  ],
  "primaryPrecursor": "string"
}
`;

export const createPrecursorUserPrompt = (report, nlpExtraction) => {
  return `
REPORT DATA:
Report ID: ${report.reportId}
Report Type: ${report.normalizedReport?.reportType || report.sourceType}
Site: ${report.normalizedReport?.site || "Unknown"}
Activity: ${report.normalizedReport?.activity || "Unknown"}
Location: ${report.normalizedReport?.location || "Unknown"}

ORIGINAL REPORT TEXT:
${report.originalContent || report.normalizedReport?.description || ""}

EXTRACTED ENTITIES & BARRIERS:
Hazards: ${JSON.stringify(nlpExtraction?.hazards || [])}
Energy Sources: ${JSON.stringify(nlpExtraction?.energySources || [])}
Barriers: ${JSON.stringify(nlpExtraction?.barriers || [])}
Unsafe Acts: ${JSON.stringify(nlpExtraction?.unsafeActs || [])}
Unsafe Conditions: ${JSON.stringify(nlpExtraction?.unsafeConditions || [])}
  `.trim();
};

export default {
  PRECURSOR_DETECTION_SYSTEM_PROMPT,
  createPrecursorUserPrompt,
};
