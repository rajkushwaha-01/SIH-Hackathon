import { describe, it, expect } from "vitest";
import { PrecursorService } from "../../src/services/precursor/PrecursorService.js";
import { BarrierService } from "../../src/services/barrier/BarrierService.js";
import { PRECURSOR_TAXONOMY, PRECURSOR_DEFINITIONS } from "../../src/constants/precursor.constants.js";
import { precursorDetectionOutputSchema } from "../../src/validators/precursor.validator.js";
import precursorCases from "../fixtures/precursor_cases.json";

describe("Phase 6 - Precursor Detection & Barrier Intelligence Unit Tests", () => {
  describe("Taxonomy Integrity", () => {
    it("should provide exactly 14 official precursor taxonomy definitions", () => {
      const taxonomy = PrecursorService.getTaxonomy();
      expect(taxonomy.count).toBe(14);
      expect(taxonomy.list).toHaveLength(14);
      expect(Object.keys(taxonomy.taxonomy)).toHaveLength(14);
    });

    it("should retrieve valid metadata for a specific precursor type", () => {
      const heightDef = PrecursorService.getPrecursorByType("WORKING_AT_HEIGHT");
      expect(heightDef.name).toBe("Working at Height");
      expect(heightDef.defaultSeverity).toBe("CRITICAL");
      expect(heightDef.criticalBarriers).toContain("100% Fall Arrest Tie-Off");
    });

    it("should throw 404 AppError for unknown precursor type", () => {
      expect(() => PrecursorService.getPrecursorByType("NON_EXISTENT_TYPE")).toThrow();
    });
  });

  describe("Multi-Precursor Detection Evaluation", () => {
    it("should detect multiple concurrent precursors (Height + Dropped Object + Line of Fire)", () => {
      const testCase = precursorCases.find((c) => c.id === "CASE-PREC-01");
      const mockReport = {
        reportId: testCase.id,
        originalContent: testCase.description,
        normalizedReport: { description: testCase.description },
      };

      const result = PrecursorService.evaluateDeterministicPrecursors(mockReport);
      const validated = precursorDetectionOutputSchema.parse(result);

      const detectedTypes = validated.detectedPrecursors.map((p) => p.type);
      expect(detectedTypes).toContain("WORKING_AT_HEIGHT");
      expect(detectedTypes).toContain("DROPPED_OBJECTS");
      expect(detectedTypes).toContain("LINE_OF_FIRE");
      expect(validated.barrierSignals.length).toBeGreaterThan(0);
    });

    it("should detect Electrical Exposure and Isolation Failure concurrently", () => {
      const testCase = precursorCases.find((c) => c.id === "CASE-PREC-02");
      const mockReport = {
        reportId: testCase.id,
        originalContent: testCase.description,
        normalizedReport: { description: testCase.description },
      };

      const result = PrecursorService.evaluateDeterministicPrecursors(mockReport);
      const validated = precursorDetectionOutputSchema.parse(result);

      const detectedTypes = validated.detectedPrecursors.map((p) => p.type);
      expect(detectedTypes).toContain("ELECTRICAL_EXPOSURE");
      expect(detectedTypes).toContain("ISOLATION_FAILURE");
    });

    it("should detect Confined Space and Chemical Exposure concurrently", () => {
      const testCase = precursorCases.find((c) => c.id === "CASE-PREC-03");
      const mockReport = {
        reportId: testCase.id,
        originalContent: testCase.description,
        normalizedReport: { description: testCase.description },
      };

      const result = PrecursorService.evaluateDeterministicPrecursors(mockReport);
      const validated = precursorDetectionOutputSchema.parse(result);

      const detectedTypes = validated.detectedPrecursors.map((p) => p.type);
      expect(detectedTypes).toContain("CONFINED_SPACE");
      expect(detectedTypes).toContain("CHEMICAL_EXPOSURE");
    });
  });

  describe("Barrier Resilience Intelligence", () => {
    it("should calculate strong barrier resilience score when all barriers are effective", () => {
      const effectiveBarriers = [
        { category: "ENGINEERING", status: "PRESENT_EFFECTIVE" },
        { category: "PPE", status: "PRESENT_EFFECTIVE" },
      ];

      const result = BarrierService.calculateBarrierResilience(effectiveBarriers);
      expect(result.score).toBe(100);
      expect(result.status).toBe("STRONG");
      expect(result.failedCount).toBe(0);
    });

    it("should calculate critical deficit when critical engineering barriers fail", () => {
      const failedBarriers = [
        { category: "ENGINEERING", status: "FAILED" },
        { category: "ADMINISTRATIVE", status: "MISSING" },
      ];

      const result = BarrierService.calculateBarrierResilience(failedBarriers);
      expect(result.score).toBe(0);
      expect(result.status).toBe("CRITICAL_DEFICIT");
      expect(result.failedCount).toBe(2);
    });
  });
});
