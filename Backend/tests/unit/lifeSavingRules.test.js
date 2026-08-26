import { describe, it, expect } from "vitest";
import { LifeSavingRulesService } from "../../src/services/lifeSavingRules/LifeSavingRulesService.js";
import { OFFICIAL_IOGP_RULES, IOGP_REPORT_CITATION } from "../../src/constants/lifeSavingRules.constants.js";

describe("Phase 7 - IOGP Life-Saving Rules Mapping Unit Tests", () => {
  describe("Official Knowledge Base Integrity", () => {
    it("should contain exactly 9 official IOGP Life-Saving Rules", async () => {
      const rules = await LifeSavingRulesService.getAllRules();
      expect(rules).toHaveLength(9);
      expect(OFFICIAL_IOGP_RULES).toHaveLength(9);
    });

    it("should ensure every rule cites official IOGP Report 459", () => {
      for (const rule of OFFICIAL_IOGP_RULES) {
        expect(rule.source).toBe(IOGP_REPORT_CITATION);
        expect(rule.sourceUrl).toContain("iogp.org");
        expect(rule.mandatoryActions.length).toBeGreaterThan(0);
      }
    });

    it("should retrieve a single rule by code or ruleId", async () => {
      const rule = await LifeSavingRulesService.getRuleById("ENERGY_ISOLATION");
      expect(rule.ruleId).toBe("IOGP-LSR-04");
      expect(rule.officialName).toBe("Energy Isolation");

      const ruleById = await LifeSavingRulesService.getRuleById("IOGP-LSR-09");
      expect(ruleById.officialName).toBe("Working at Height");
    });
  });

  describe("Deterministic Rule Mapping", () => {
    it("should map WORKING_AT_HEIGHT precursor to official 'Working at Height' rule", () => {
      const mockReport = {
        reportId: "INC-HEIGHT-01",
        originalContent: "Worker working at 8m elevation without safety harness tie-off.",
        normalizedReport: { description: "Worker working at 8m elevation without safety harness tie-off." },
      };
      const mockPrecursors = [{ type: "WORKING_AT_HEIGHT", evidenceText: "Worker unhooked at 8m height" }];

      const mapped = LifeSavingRulesService.mapLifeSavingRules(mockReport, {}, mockPrecursors);
      const ruleNames = mapped.map((m) => m.ruleName);

      expect(ruleNames).toContain("Working at Height");
      expect(mapped[0].confidence).toBeGreaterThanOrEqual(0.85);
      expect(mapped[0].evidenceText).toBeDefined();
    });

    it("should map ISOLATION_FAILURE and ENERGY_EXPOSURE to 'Energy Isolation'", () => {
      const mockReport = {
        reportId: "INC-ELEC-01",
        originalContent: "Electrician worked on live voltage circuit without LOTO zero energy verification.",
        normalizedReport: { description: "Electrician worked on live voltage circuit without LOTO zero energy verification." },
      };
      const mockPrecursors = [
        { type: "ELECTRICAL_EXPOSURE", evidenceText: "Live circuit access" },
        { type: "ISOLATION_FAILURE", evidenceText: "No LOTO verification" },
      ];

      const mapped = LifeSavingRulesService.mapLifeSavingRules(mockReport, {}, mockPrecursors);
      const ruleNames = mapped.map((m) => m.ruleName);

      expect(ruleNames).toContain("Energy Isolation");
    });

    it("should map DROPPED_OBJECTS to 'Line of Fire'", () => {
      const mockReport = {
        reportId: "INC-DROP-01",
        originalContent: "A 4kg wrench was dropped from crane deck into walkway below.",
        normalizedReport: { description: "A 4kg wrench was dropped from crane deck into walkway below." },
      };
      const mockPrecursors = [{ type: "DROPPED_OBJECTS", evidenceText: "Wrench dropped from crane deck" }];

      const mapped = LifeSavingRulesService.mapLifeSavingRules(mockReport, {}, mockPrecursors);
      const ruleNames = mapped.map((m) => m.ruleName);

      expect(ruleNames).toContain("Line of Fire");
    });

    it("should not map any Life-Saving Rules for non-SIF housekeeping observation", () => {
      const mockReport = {
        reportId: "INC-HOUSE-01",
        originalContent: "Plastic bottles on floor in canteen walkway. Housekeeping notified.",
        normalizedReport: { description: "Plastic bottles on floor in canteen walkway." },
      };

      const mapped = LifeSavingRulesService.mapLifeSavingRules(mockReport, {}, []);
      expect(mapped).toHaveLength(0);
    });
  });
});
