import {
  HAZARD_BASE_WEIGHTS,
  ENERGY_MAGNITUDE_WEIGHTS,
  BARRIER_STATUS_IMPACTS,
  HIERARCHY_MULTIPLIERS,
  RISK_LEVEL_THRESHOLDS,
} from "../../constants/severity.constants.js";

export const RISK_ENGINE_VERSION = "risk-calc-v1.0";

export class RiskScoringEngine {
  /**
   * Deterministically calculate reproducible scenario risk score.
   */
  static calculateRiskScore({
    report = {},
    nlpExtraction = {},
    detectedPrecursors = [],
    sifClassification = {},
  } = {}) {
    const factors = [];
    let rawScore = 15; // Base baseline occupational score

    // 1. Evaluate Energy Sources & Hazards
    const energySources = nlpExtraction.energySources || [];
    let highestEnergyImpact = 0;
    let highestEnergyType = "";

    for (const energy of energySources) {
      const typeKey = (energy.type || "").toUpperCase();
      const baseWeight = HAZARD_BASE_WEIGHTS[typeKey] || 15;
      const magWeight = ENERGY_MAGNITUDE_WEIGHTS[energy.magnitude?.toUpperCase()] || 12;
      const energyImpact = energy.controlled ? Math.round(magWeight * 0.3) : Math.round((baseWeight + magWeight) * 0.5);

      if (energyImpact > highestEnergyImpact) {
        highestEnergyImpact = energyImpact;
        highestEnergyType = energy.type;
      }
    }

    if (highestEnergyImpact > 0) {
      rawScore += highestEnergyImpact;
      factors.push({
        factor: `Hazardous Energy Exposure (${highestEnergyType})`,
        weight: 30,
        impact: highestEnergyImpact,
        reason: `Exposure to ${highestEnergyType} energy source.`,
      });
    }

    // 2. Evaluate Barrier Failures & Effective Controls
    const barriers = nlpExtraction.barriers || [];
    for (const barrier of barriers) {
      const category = (barrier.category || "ENGINEERING").toUpperCase();
      const status = (barrier.status || "PRESENT_EFFECTIVE").toUpperCase();
      const baseImpact = BARRIER_STATUS_IMPACTS[status] ?? 0;
      const multiplier = HIERARCHY_MULTIPLIERS[category] ?? 1.0;
      const netImpact = Math.round(baseImpact * multiplier);

      if (netImpact !== 0) {
        rawScore += netImpact;
        factors.push({
          factor: `Barrier Status: ${barrier.name || "Safety Control"}`,
          weight: Math.abs(netImpact),
          impact: netImpact,
          reason: `Barrier '${barrier.name}' was evaluated as ${status} (${category} control).`,
        });
      }
    }

    // 3. Precursor Multiplier & Precursor Exposure Points
    if (detectedPrecursors && detectedPrecursors.length > 0) {
      const precursorPoints = Math.min(25, detectedPrecursors.length * 8);
      rawScore += precursorPoints;
      factors.push({
        factor: "Active SIF Precursor Conditions",
        weight: 25,
        impact: precursorPoints,
        reason: `Identified ${detectedPrecursors.length} active precursor signal(s): ${detectedPrecursors.map((p) => p.type).join(", ")}.`,
      });
    }

    // 4. SIF Potential Kicker
    if (sifClassification.classification === "SIF_POTENTIAL") {
      const sifPoints = 15;
      rawScore += sifPoints;
      factors.push({
        factor: "SIF Potential Classification",
        weight: 15,
        impact: sifPoints,
        reason: "Event has been classified as possessing high potential for serious injury or fatality.",
      });
    }

    // 5. Fatal Potential Consequence Point
    if (nlpExtraction.consequences?.potentialFatalities) {
      const fatalPoints = 10;
      rawScore += fatalPoints;
      factors.push({
        factor: "Potential Fatal Consequence",
        weight: 10,
        impact: fatalPoints,
        reason: "Worst-case scenario includes potential life-altering or fatal consequence.",
      });
    }

    // Clamp score strictly between 0 and 100
    const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));

    // Determine Risk Level
    let level = "LOW";
    if (finalScore >= RISK_LEVEL_THRESHOLDS.CRITICAL) {
      level = "CRITICAL";
    } else if (finalScore >= RISK_LEVEL_THRESHOLDS.HIGH) {
      level = "HIGH";
    } else if (finalScore >= RISK_LEVEL_THRESHOLDS.MEDIUM) {
      level = "MEDIUM";
    }

    // Determine Dominant Factor (highest positive impact factor)
    const positiveFactors = factors.filter((f) => f.impact > 0);
    const dominantFactorObj = positiveFactors.sort((a, b) => b.impact - a.impact)[0];
    const dominantFactor = dominantFactorObj ? dominantFactorObj.factor : "General Workplace Environment";

    return {
      score: finalScore,
      level,
      dominantFactor,
      factors,
      engineVersion: RISK_ENGINE_VERSION,
    };
  }
}

export default RiskScoringEngine;
