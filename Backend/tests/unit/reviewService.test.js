import { describe, it, expect } from "vitest";
import { ReviewService } from "../../src/services/review/ReviewService.js";

describe("Phase 17 - Human-in-the-Loop Review & Audit Trail Unit Tests", () => {
  it("should assemble complete 360-degree report detail payload", async () => {
    const detail = await ReviewService.getReportDetail("INC-2026-001");

    expect(detail).toHaveProperty("report");
    expect(detail).toHaveProperty("latestAnalysis");
    expect(detail).toHaveProperty("reviewStatus");
    expect(detail).toHaveProperty("versionHistory");
    expect(detail).toHaveProperty("auditTrail");
    expect(detail).toHaveProperty("alerts");
  });

  it("should process human review APPROVAL decision", async () => {
    const result = await ReviewService.submitReview({
      reportId: "INC-2026-001",
      decision: "APPROVE",
      justification: "Verified all incident facts and barrier classifications against site investigation.",
    });

    expect(result.reviewStatus).toBe("APPROVED");
    expect(result.decision).toBe("APPROVE");
  });

  it("should process human review OVERRIDE decision", async () => {
    const result = await ReviewService.submitReview({
      reportId: "INC-2026-001",
      decision: "OVERRIDE",
      overrideSifClassification: "NON_SIF",
      overrideRiskScore: 40,
      justification: "Secondary barrier was verified in place; reduced risk from SIF to Non-SIF.",
    });

    expect(result.reviewStatus).toBe("OVERRIDDEN");
    expect(result.decision).toBe("OVERRIDE");
  });

  it("should retrieve chronological audit trail entries", async () => {
    const auditTrail = await ReviewService.getAuditTrail("INC-2026-001");

    expect(auditTrail.length).toBeGreaterThan(0);
    expect(auditTrail[0]).toHaveProperty("auditId");
    expect(auditTrail[0]).toHaveProperty("action");
    expect(auditTrail[0]).toHaveProperty("performedByName");
  });
});
