import { describe, it, expect } from "vitest";
import { NormalizationService } from "../../src/services/ingestion/NormalizationService.js";

describe("Phase 3 - NormalizationService Unit Tests", () => {
  describe("normalizeReportType", () => {
    it("should normalize 'Near Miss' variations to NEAR_MISS", () => {
      expect(NormalizationService.normalizeReportType("Near Miss")).toBe("NEAR_MISS");
      expect(NormalizationService.normalizeReportType("near-miss")).toBe("NEAR_MISS");
      expect(NormalizationService.normalizeReportType("NM")).toBe("NEAR_MISS");
      expect(NormalizationService.normalizeReportType("NEARMISS")).toBe("NEAR_MISS");
    });

    it("should normalize 'Unsafe Act' variations to UNSAFE_ACT", () => {
      expect(NormalizationService.normalizeReportType("Unsafe Act")).toBe("UNSAFE_ACT");
      expect(NormalizationService.normalizeReportType("UA")).toBe("UNSAFE_ACT");
      expect(NormalizationService.normalizeReportType("unsafe_act")).toBe("UNSAFE_ACT");
    });

    it("should normalize 'Unsafe Condition' variations to UNSAFE_CONDITION", () => {
      expect(NormalizationService.normalizeReportType("Unsafe Condition")).toBe("UNSAFE_CONDITION");
      expect(NormalizationService.normalizeReportType("UC")).toBe("UNSAFE_CONDITION");
    });

    it("should normalize 'Incident' and 'Accident' to INCIDENT", () => {
      expect(NormalizationService.normalizeReportType("Incident")).toBe("INCIDENT");
      expect(NormalizationService.normalizeReportType("Serious Accident")).toBe("INCIDENT");
    });

    it("should fallback to OBSERVATION for unknown types", () => {
      expect(NormalizationService.normalizeReportType("Random Custom String")).toBe("OBSERVATION");
      expect(NormalizationService.normalizeReportType("")).toBe("OBSERVATION");
    });
  });

  describe("normalizeDate", () => {
    it("should parse valid ISO date strings", () => {
      const dateStr = "2026-08-15T10:30:00Z";
      const normalized = NormalizationService.normalizeDate(dateStr);
      expect(normalized).toBeInstanceOf(Date);
      expect(normalized.toISOString()).toBe("2026-08-15T10:30:00.000Z");
    });

    it("should return current Date for invalid strings", () => {
      const normalized = NormalizationService.normalizeDate("invalid-date-string");
      expect(normalized).toBeInstanceOf(Date);
      expect(isNaN(normalized.getTime())).toBe(false);
    });
  });

  describe("normalize", () => {
    it("should normalize a raw object into canonical normalizedReport schema", () => {
      const raw = {
        title: "Fall Protection Not Hooked",
        type: "Near Miss",
        site: "Site A",
        facility: "Rig 4",
        location: "Scaffold Deck",
        activity: "Working at Height",
        description: "Scaffolder unhooked harness at 6m elevation.",
        injurySeverity: "NONE",
      };

      const result = NormalizationService.normalize(raw);

      expect(result.reportType).toBe("NEAR_MISS");
      expect(result.title).toBe("Fall Protection Not Hooked");
      expect(result.site).toBe("Site A");
      expect(result.facility).toBe("Rig 4");
      expect(result.location).toBe("Scaffold Deck");
      expect(result.activity).toBe("Working at Height");
      expect(result.description).toBe("Scaffolder unhooked harness at 6m elevation.");
      expect(result.actualOutcome.injurySeverity).toBe("NONE");
    });
  });
});
