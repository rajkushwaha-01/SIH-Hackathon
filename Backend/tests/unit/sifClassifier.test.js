import { describe, it, expect } from "vitest";
import { SifClassifierService } from "../../src/services/sif/SifClassifierService.js";
import { sifClassificationSchema } from "../../src/validators/sif.validator.js";
import sifCases from "../fixtures/sif_cases.json";

describe("Phase 5 - SIF Classifier Service Unit Tests", () => {
  describe("Deterministic SIF Classifier Evaluation", () => {
    it("should classify high-energy height exposure with missing tie-off as SIF_POTENTIAL", () => {
      const heightCase = sifCases.find((c) => c.id === "CASE-SIF-01");
      const mockReport = {
        reportId: heightCase.id,
        originalContent: heightCase.description,
        normalizedReport: {
          activity: "Scaffolding",
          location: "5th Tier Scaffold",
          description: heightCase.description,
        },
      };

      const result = SifClassifierService.evaluateDeterministicSif(mockReport);
      const validated = sifClassificationSchema.parse(result);

      expect(validated.classification).toBe("SIF_POTENTIAL");
      expect(validated.modelConfidence).toBeGreaterThanOrEqual(0.85);
      expect(validated.isHighPotentialEvent).toBe(true);
      expect(validated.actualVsPotentialDistinction.actualOutcome).toBeDefined();
      expect(validated.actualVsPotentialDistinction.potentialOutcome).toBeDefined();
      expect(validated.actualVsPotentialDistinction.divergenceReason).toBeDefined();
    });

    it("should classify energized electrical exposure without LOTO as SIF_POTENTIAL", () => {
      const elecCase = sifCases.find((c) => c.id === "CASE-SIF-02");
      const mockReport = {
        reportId: elecCase.id,
        originalContent: elecCase.description,
        normalizedReport: {
          activity: "Electrical Maintenance",
          location: "Switchboard Room",
          description: elecCase.description,
        },
      };

      const result = SifClassifierService.evaluateDeterministicSif(mockReport);
      const validated = sifClassificationSchema.parse(result);

      expect(validated.classification).toBe("SIF_POTENTIAL");
      expect(validated.isHighPotentialEvent).toBe(true);
    });

    it("should classify low-risk housekeeping observation as NON_SIF", () => {
      const nonSifCase = sifCases.find((c) => c.id === "CASE-NON-SIF-01");
      const mockReport = {
        reportId: nonSifCase.id,
        originalContent: nonSifCase.description,
        normalizedReport: {
          activity: "Housekeeping Walkthrough",
          location: "Office container walkway",
          description: nonSifCase.description,
        },
      };

      const result = SifClassifierService.evaluateDeterministicSif(mockReport);
      const validated = sifClassificationSchema.parse(result);

      expect(validated.classification).toBe("NON_SIF");
      expect(validated.isHighPotentialEvent).toBe(false);
      expect(validated.modelConfidence).toBeGreaterThan(0.8);
    });

    it("should classify brief / ambiguous description as NEEDS_REVIEW", () => {
      const briefReport = {
        reportId: "INC-BRIEF-01",
        originalContent: "Something fell.",
        normalizedReport: {
          description: "Something fell.",
        },
      };

      const result = SifClassifierService.evaluateDeterministicSif(briefReport);
      const validated = sifClassificationSchema.parse(result);

      expect(validated.classification).toBe("NEEDS_REVIEW");
      expect(validated.classificationReason).toContain("brief");
    });
  });

  describe("Model Confidence Integrity", () => {
    it("should ensure model confidence is always bounded strictly between 0 and 1", () => {
      const mockReport = {
        reportId: "INC-TEST-CONF",
        originalContent: "Worker working at height without safety harness tie-off.",
        normalizedReport: { description: "Worker working at height without safety harness tie-off." },
      };

      const result = SifClassifierService.evaluateDeterministicSif(mockReport);
      expect(result.modelConfidence).toBeGreaterThanOrEqual(0.0);
      expect(result.modelConfidence).toBeLessThanOrEqual(1.0);
    });
  });
});
