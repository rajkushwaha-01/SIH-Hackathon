import { describe, it, expect } from "vitest";
import { AlertService } from "../../src/services/alerts/AlertService.js";

describe("Phase 16 - Smart HSE Alerts Unit Tests", () => {
  it("should generate P1_CRITICAL alert for SIF Potential incident with Critical risk level", async () => {
    const mockReport = {
      reportId: "INC-ALERT-01",
      normalizedReport: { site: "Offshore Platform Alpha" },
    };

    const mockAnalysis = {
      sifClassification: { classification: "SIF_POTENTIAL" },
      riskScore: { level: "CRITICAL", score: 88, dominantFactor: "High Voltage" },
      precursors: [{ type: "ELECTRICAL_EXPOSURE" }],
    };

    const alerts = await AlertService.evaluateReportAlerts(mockReport, mockAnalysis);

    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].priority).toBe("P1_CRITICAL");
    expect(alerts[0].triggerType).toBe("CRITICAL_SIF_EMERGENCE");
    expect(alerts[0].site).toBe("Offshore Platform Alpha");
  });

  it("should trigger P1 alert for Multiple Precursor Convergence (>= 3 precursors)", async () => {
    const mockReport = {
      reportId: "INC-MULTI-01",
      normalizedReport: { site: "Refinery Unit 4" },
    };

    const mockAnalysis = {
      sifClassification: { classification: "NON_SIF" },
      riskScore: { level: "HIGH", score: 65, dominantFactor: "Multiple Hazards" },
      precursors: [
        { type: "WORKING_AT_HEIGHT" },
        { type: "DROPPED_OBJECTS" },
        { type: "LINE_OF_FIRE" },
      ],
    };

    const alerts = await AlertService.evaluateReportAlerts(mockReport, mockAnalysis);

    expect(alerts.length).toBeGreaterThan(0);
    const multiAlert = alerts.find((a) => a.triggerType === "MULTIPLE_PRECURSOR_CONVERGENCE");
    expect(multiAlert).toBeDefined();
    expect(multiAlert.priority).toBe("P1_CRITICAL");
  });

  it("should handle alert acknowledge and resolution lifecycle", async () => {
    const alertId = "ALT-2026-TEST";

    const ackResult = await AlertService.acknowledgeAlert(alertId);
    expect(ackResult.status).toBe("ACKNOWLEDGED");

    const resResult = await AlertService.resolveAlert(alertId, "Safety guard installed and verified");
    expect(resResult.status).toBe("RESOLVED");
    expect(resResult.resolutionNotes).toBe("Safety guard installed and verified");
  });

  it("should calculate alert statistics", async () => {
    const stats = await AlertService.getAlertStats();
    expect(stats).toHaveProperty("totalOpen");
    expect(stats).toHaveProperty("p1Critical");
    expect(stats).toHaveProperty("resolved");
  });
});
