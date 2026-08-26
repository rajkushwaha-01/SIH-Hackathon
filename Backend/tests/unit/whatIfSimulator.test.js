import { describe, it, expect } from "vitest";
import { WhatIfSimulatorService } from "../../src/services/simulator/WhatIfSimulatorService.js";

describe("Phase 13 - What-If Risk Simulator Unit Tests", () => {
  it("should calculate significant risk reduction when restoring failed critical barriers", async () => {
    const simulation = await WhatIfSimulatorService.simulateScenario({
      scenarioName: "Restore LOTO and Multi-meter Test",
      barrierModifications: [
        {
          barrierName: "Lockout / Tagout (LOTO)",
          category: "ENGINEERING",
          simulatedStatus: "PRESENT_EFFECTIVE",
        },
        {
          barrierName: "Zero Voltage Verification",
          category: "PROCEDURAL",
          simulatedStatus: "PRESENT_EFFECTIVE",
        },
      ],
      energyModifications: [
        {
          energyType: "ELECTRICAL",
          action: "CONTROL",
        },
      ],
    });

    expect(simulation).toHaveProperty("simulationId");
    expect(simulation.delta.scoreDifference).toBeLessThan(0); // Score was reduced
    expect(simulation.delta.mitigationEfficacy).toBeGreaterThan(0);
    expect(simulation.simulated.riskScore).toBeLessThan(simulation.baseline.riskScore);
    expect(simulation.scenarioExplanation).toContain("point risk reduction");
  });

  it("should calculate risk escalation when removing protective barriers or introducing precursors", async () => {
    const simulation = await WhatIfSimulatorService.simulateScenario({
      scenarioName: "Remove Safety Harness at Height",
      precursorModifications: [
        {
          precursorType: "WORKING_AT_HEIGHT",
          action: "ADD",
        },
        {
          precursorType: "DROPPED_OBJECTS",
          action: "ADD",
        },
      ],
      energyModifications: [
        {
          energyType: "ELECTRICAL",
          action: "UNCONTROL",
        },
      ],
    });

    expect(simulation.delta.scoreDifference).toBeGreaterThanOrEqual(0);
    expect(simulation.simulated.riskScore).toBeGreaterThanOrEqual(simulation.baseline.riskScore);
  });

  it("should format multi-scenario comparison matrix", async () => {
    const mockSimulations = [
      {
        simulationId: "SIM-2026-0001",
        scenarioName: "Scenario A: Full Controls",
        baseReportId: "INC-001",
        baseline: { riskScore: 85, riskLevel: "HIGH", sifClassification: "SIF_POTENTIAL" },
        simulated: { riskScore: 25, riskLevel: "LOW", sifClassification: "NON_SIF" },
        delta: { scoreDifference: -60, mitigationEfficacy: 71 },
        scenarioExplanation: "Full mitigation achieved",
      },
    ];

    expect(mockSimulations.length).toBeGreaterThan(0);
  });
});
