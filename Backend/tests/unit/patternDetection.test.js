import { describe, it, expect } from "vitest";
import { PatternDetectionService } from "../../src/services/pattern/PatternDetectionService.js";

describe("Phase 11 - PatternDetectionService Unit Tests", () => {
  it("should return valid recurring pattern clusters with dimensions and metrics", async () => {
    const patterns = await PatternDetectionService.getPatterns();

    expect(patterns.length).toBeGreaterThan(0);
    const pattern = patterns[0];

    expect(pattern).toHaveProperty("patternId");
    expect(pattern).toHaveProperty("name");
    expect(pattern.dimensions).toHaveProperty("site");
    expect(pattern.dimensions).toHaveProperty("precursor");
    expect(pattern.incidentCount).toBeGreaterThanOrEqual(2);
    expect(pattern.confidence).toBeGreaterThanOrEqual(0.7);
    expect(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).toContain(pattern.severity);
    expect(pattern.recommendedInterventions.length).toBeGreaterThan(0);
  });

  it("should retrieve single pattern by ID", async () => {
    const pattern = await PatternDetectionService.getPatternById("PAT-2026-001");
    expect(pattern.patternId).toBe("PAT-2026-001");
    expect(pattern.dimensions.precursor).toBe("WORKING_AT_HEIGHT");
  });

  it("should throw 404 AppError for non-existent pattern ID", async () => {
    await expect(PatternDetectionService.getPatternById("PAT-NON-EXISTENT")).rejects.toThrow();
  });
});
