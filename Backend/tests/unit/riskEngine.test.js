import { describe, it, expect } from "vitest";
import { RiskScoringEngine, RISK_ENGINE_VERSION } from "../../src/services/risk/RiskScoringEngine.js";

describe("Phase 8 - Deterministic Risk Scoring Engine Unit Tests", () => {
  describe("Reproducibility & Determinism", () => {
    it("should produce identical numerical score and factors for identical input parameters", () => {
      const input = {
        report: { reportId: "INC-REPRO-01" },
        nlpExtraction: {
          energySources: [{ type: "GRAVITY", magnitude: "HIGH", controlled: false }],
          barriers: [{ name: "Fall Protection Harness", category: "PPE", status: "FAILED" }],
          consequences: { potentialFatalities: true },
        },
        detectedPrecursors: [{ type: "WORKING_AT_HEIGHT", confidence: 0.95 }],
        sifClassification: { classification: "SIF_POTENTIAL" },
      };

      const result1 = RiskScoringEngine.calculateRiskScore(input);
      const result2 = RiskScoringEngine.calculateRiskScore(input);

      expect(result1.score).toBe(result2.score);
      expect(result1.level).toBe(result2.level);
      expect(result1.dominantFactor).toBe(result2.dominantFactor);
      expect(result1.factors).toEqual(result2.factors);
      expect(result1.engineVersion).toBe(RISK_ENGINE_VERSION);
    });
  });

  describe("Scenario Calculations", () => {
    it("should calculate HIGH/CRITICAL score for uncontrolled high voltage + missing LOTO", () => {
      const input = {
        report: { reportId: "INC-ELEC-HIGH" },
        nlpExtraction: {
          energySources: [{ type: "ELECTRICAL", magnitude: "HIGH", controlled: false }],
          barriers: [
            { name: "Lockout / Tagout (LOTO)", category: "ENGINEERING", status: "MISSING" },
            { name: "Multi-meter Voltage Test", category: "PROCEDURAL", status: "FAILED" },
          ],
          consequences: { potentialFatalities: true },
        },
        detectedPrecursors: [
          { type: "ELECTRICAL_EXPOSURE", confidence: 0.95 },
          { type: "ISOLATION_FAILURE", confidence: 0.92 },
        ],
        sifClassification: { classification: "SIF_POTENTIAL" },
      };

      const result = RiskScoringEngine.calculateRiskScore(input);

      expect(result.score).toBeGreaterThanOrEqual(75);
      expect(["HIGH", "CRITICAL"]).toContain(result.level);
      expect(result.factors.length).toBeGreaterThan(3);
    });

    it("should award score reduction credit for effective engineering barriers", () => {
      const baseInput = {
        report: { reportId: "INC-MITIGATE-01" },
        nlpExtraction: {
          energySources: [{ type: "PRESSURE", magnitude: "HIGH", controlled: true }],
          barriers: [
            { name: "Pressure Relief Valve (PRV)", category: "ENGINEERING", status: "PRESENT_EFFECTIVE" },
            { name: "Automatic Emergency Shutdown", category: "ENGINEERING", status: "PRESENT_EFFECTIVE" },
          ],
          consequences: { potentialFatalities: false },
        },
        detectedPrecursors: [],
        sifClassification: { classification: "NON_SIF" },
      };

      const result = RiskScoringEngine.calculateRiskScore(baseInput);

      expect(result.score).toBeLessThan(40);
      expect(["LOW", "MEDIUM"]).toContain(result.level);
    });

    it("should calculate LOW score for non-SIF housekeeping observation", () => {
      const input = {
        report: { reportId: "INC-LOW-01" },
        nlpExtraction: {
          energySources: [{ type: "OCCUPATIONAL", magnitude: "LOW", controlled: true }],
          barriers: [{ name: "Housekeeping Inspection", category: "ADMINISTRATIVE", status: "PRESENT_EFFECTIVE" }],
          consequences: { potentialFatalities: false },
        },
        detectedPrecursors: [],
        sifClassification: { classification: "NON_SIF" },
      };

      const result = RiskScoringEngine.calculateRiskScore(input);

      expect(result.score).toBeLessThan(35);
      expect(result.level).toBe("LOW");
    });
  });

  describe("Dominant Factor & Boundary Integrity", () => {
    it("should correctly identify the factor with the highest positive risk impact", () => {
      const input = {
        report: { reportId: "INC-DOM-01" },
        nlpExtraction: {
          energySources: [{ type: "ELECTRICAL", magnitude: "HIGH", controlled: false }],
          barriers: [{ name: "Arc Flash PPE", category: "PPE", status: "FAILED" }],
          consequences: { potentialFatalities: false },
        },
        detectedPrecursors: [],
        sifClassification: { classification: "NON_SIF" },
      };

      const result = RiskScoringEngine.calculateRiskScore(input);
      expect(result.dominantFactor).toContain("Hazardous Energy Exposure");
    });

    it("should strictly clamp score within [0, 100] even with extreme values", () => {
      // Multiple extreme failures
      const extremeFailureInput = {
        report: { reportId: "INC-EXTREME" },
        nlpExtraction: {
          energySources: [
            { type: "ELECTRICAL", magnitude: "HIGH", controlled: false },
            { type: "PRESSURE", magnitude: "HIGH", controlled: false },
            { type: "CHEMICAL", magnitude: "HIGH", controlled: false },
          ],
          barriers: [
            { name: "B1", category: "ENGINEERING", status: "MISSING" },
            { name: "B2", category: "ENGINEERING", status: "MISSING" },
            { name: "B3", category: "ENGINEERING", status: "MISSING" },
            { name: "B4", category: "ENGINEERING", status: "MISSING" },
          ],
          consequences: { potentialFatalities: true },
        },
        detectedPrecursors: [
          { type: "ELECTRICAL_EXPOSURE" },
          { type: "ISOLATION_FAILURE" },
          { type: "PRESSURE_RELEASE" },
        ],
        sifClassification: { classification: "SIF_POTENTIAL" },
      };

      const result = RiskScoringEngine.calculateRiskScore(extremeFailureInput);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.level).toBe("CRITICAL");
    });
  });
});
