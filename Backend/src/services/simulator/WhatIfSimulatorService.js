import mongoose from "mongoose";
import { Simulation } from "../../models/Simulation.js";
import { SafetyReport } from "../../models/SafetyReport.js";
import { Analysis } from "../../models/Analysis.js";
import { RiskScoringEngine } from "../risk/RiskScoringEngine.js";
import { SifClassifierService } from "../sif/SifClassifierService.js";
import { AppError } from "../../utils/appError.js";
import { logger } from "../../utils/logger.js";

export class WhatIfSimulatorService {
  /**
   * Run counterfactual What-If risk simulation.
   */
  static async simulateScenario({
    scenarioName = "Unnamed Simulation Scenario",
    baseReportId = null,
    customScenarioText = "",
    barrierModifications = [],
    precursorModifications = [],
    energyModifications = [],
    userId = null,
  } = {}) {
    logger.info(`Running What-If simulation: "${scenarioName}" (Base Report: ${baseReportId || "Custom"})`);

    let baselineReport = null;
    let baselineAnalysis = null;

    if (baseReportId && mongoose.connection.readyState === 1) {
      const isObjectId = baseReportId.match(/^[0-9a-fA-F]{24}$/);
      const query = isObjectId ? { $or: [{ _id: baseReportId }, { reportId: baseReportId }] } : { reportId: baseReportId };
      baselineReport = await SafetyReport.findOne(query);
      const canonicalId = baselineReport ? baselineReport.reportId : baseReportId;
      baselineAnalysis = await Analysis.findOne({
        $or: [{ reportId: canonicalId }, { reportId: baseReportId }],
        isLatest: true,
      });
    }

    // Baseline fallback structure if DB not connected or custom scenario
    const baselineExtraction = baselineAnalysis?.nlpExtraction || {
      activity: "General Industrial Task",
      energySources: [{ type: "ELECTRICAL", magnitude: "HIGH", controlled: false }],
      barriers: [
        { name: "Lockout / Tagout (LOTO)", category: "ENGINEERING", status: "FAILED" },
        { name: "Zero Voltage Verification", category: "PROCEDURAL", status: "FAILED" },
      ],
      consequences: { potentialFatalities: true, worstCaseConsequence: "Fatal Electrocution" },
    };

    const baselinePrecursors = baselineAnalysis?.precursors || [
      { type: "ELECTRICAL_EXPOSURE", confidence: 0.95 },
      { type: "ISOLATION_FAILURE", confidence: 0.92 },
    ];

    const baselineSif = baselineAnalysis?.sifClassification || {
      classification: "SIF_POTENTIAL",
      modelConfidence: 0.92,
      isHighPotentialEvent: true,
    };

    const baselineRisk = baselineAnalysis?.riskScore || RiskScoringEngine.calculateRiskScore({
      report: baselineReport || { originalContent: customScenarioText },
      nlpExtraction: baselineExtraction,
      detectedPrecursors: baselinePrecursors,
      sifClassification: baselineSif,
    });

    // 2. Clone and Apply Modifications to Create Simulated State
    const simulatedExtraction = JSON.parse(JSON.stringify(baselineExtraction));
    let simulatedPrecursors = JSON.parse(JSON.stringify(baselinePrecursors));

    const impactFactors = [];

    // Apply Barrier Modifications
    for (const mod of barrierModifications) {
      const existingBarrier = simulatedExtraction.barriers.find(
        (b) => b.name.toLowerCase() === mod.barrierName.toLowerCase()
      );

      if (existingBarrier) {
        const oldStatus = existingBarrier.status;
        existingBarrier.status = mod.simulatedStatus;
        impactFactors.push({
          factor: `Barrier '${mod.barrierName}' status changed: ${oldStatus} ➔ ${mod.simulatedStatus}`,
          impact: mod.simulatedStatus === "PRESENT_EFFECTIVE" ? -20 : mod.simulatedStatus === "FAILED" ? +20 : +10,
          reason: `Modified barrier reliability to ${mod.simulatedStatus}`,
        });
      } else {
        simulatedExtraction.barriers.push({
          name: mod.barrierName,
          category: mod.category || "ENGINEERING",
          status: mod.simulatedStatus,
        });
        impactFactors.push({
          factor: `Introduced new barrier '${mod.barrierName}' (${mod.simulatedStatus})`,
          impact: mod.simulatedStatus === "PRESENT_EFFECTIVE" ? -25 : +15,
          reason: `Added engineered/administrative control`,
        });
      }
    }

    // Apply Precursor Modifications
    for (const pMod of precursorModifications) {
      if (pMod.action === "REMOVE") {
        simulatedPrecursors = simulatedPrecursors.filter((p) => p.type !== pMod.precursorType);
        impactFactors.push({
          factor: `Precursor '${pMod.precursorType}' eliminated`,
          impact: -15,
          reason: `Eliminated hazardous precursor condition`,
        });
      } else if (pMod.action === "ADD") {
        if (!simulatedPrecursors.some((p) => p.type === pMod.precursorType)) {
          simulatedPrecursors.push({ type: pMod.precursorType, confidence: 0.9 });
          impactFactors.push({
            factor: `Precursor '${pMod.precursorType}' introduced`,
            impact: +15,
            reason: `Introduced operational precursor hazard`,
          });
        }
      }
    }

    // Apply Energy Modifications
    for (const eMod of energyModifications) {
      const existingEnergy = simulatedExtraction.energySources.find(
        (e) => e.type.toLowerCase() === eMod.energyType.toLowerCase()
      );

      if (existingEnergy) {
        if (eMod.action === "CONTROL") {
          existingEnergy.controlled = true;
          impactFactors.push({
            factor: `Energy source '${eMod.energyType}' fully controlled/isolated`,
            impact: -20,
            reason: `Active positive physical control established`,
          });
        } else if (eMod.action === "UNCONTROL") {
          existingEnergy.controlled = false;
          impactFactors.push({
            factor: `Energy source '${eMod.energyType}' left uncontrolled`,
            impact: +20,
            reason: `Loss of primary containment / control`,
          });
        } else if (eMod.action === "REMOVE") {
          simulatedExtraction.energySources = simulatedExtraction.energySources.filter(
            (e) => e.type.toLowerCase() !== eMod.energyType.toLowerCase()
          );
          impactFactors.push({
            factor: `Energy source '${eMod.energyType}' completely eliminated`,
            impact: -30,
            reason: `Top hierarchy of control (Elimination) applied`,
          });
        }
      }
    }

    // 3. Run Deterministic Evaluators on Simulated State
    const simulatedSif = SifClassifierService.evaluateDeterministicSif(
      { originalContent: customScenarioText || baselineReport?.originalContent || "" },
      simulatedExtraction
    );

    const simulatedRisk = RiskScoringEngine.calculateRiskScore({
      report: baselineReport || { originalContent: customScenarioText },
      nlpExtraction: simulatedExtraction,
      detectedPrecursors: simulatedPrecursors,
      sifClassification: simulatedSif,
    });

    // 4. Calculate Deltas
    const scoreDifference = simulatedRisk.score - baselineRisk.score;
    const levelChanged = simulatedRisk.level !== baselineRisk.level;
    const sifStatusChanged = simulatedSif.classification !== baselineSif.classification;

    const mitigationEfficacy = baselineRisk.score > 0 && scoreDifference < 0
      ? Math.round((Math.abs(scoreDifference) / baselineRisk.score) * 100)
      : 0;

    let scenarioExplanation = "";
    if (scoreDifference < 0) {
      scenarioExplanation = `Simulation demonstrates a **${Math.abs(scoreDifference)} point risk reduction** (${mitigationEfficacy}% mitigation efficacy). Restoring critical barrier controls reduced risk level from ${baselineRisk.level} to ${simulatedRisk.level}.`;
    } else if (scoreDifference > 0) {
      scenarioExplanation = `Simulation demonstrates a **${scoreDifference} point risk escalation**. Barrier degradation or precursor introduction escalated risk from ${baselineRisk.level} to ${simulatedRisk.level}.`;
    } else {
      scenarioExplanation = `Simulation parameters resulted in no net change to the risk profile (Risk Score: ${simulatedRisk.score}).`;
    }

    const simulationId = `SIM-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    const simulationDoc = new Simulation({
      simulationId,
      scenarioName,
      baseReportId,
      userId,
      baseline: {
        riskScore: baselineRisk.score,
        riskLevel: baselineRisk.level,
        sifClassification: baselineSif.classification,
        barriers: baselineExtraction.barriers.map((b) => ({ name: b.name, category: b.category, status: b.status })),
        precursors: baselinePrecursors.map((p) => p.type),
      },
      simulated: {
        riskScore: simulatedRisk.score,
        riskLevel: simulatedRisk.level,
        sifClassification: simulatedSif.classification,
        barriers: simulatedExtraction.barriers.map((b) => ({ name: b.name, category: b.category, status: b.status })),
        precursors: simulatedPrecursors.map((p) => p.type),
      },
      delta: {
        scoreDifference,
        levelChanged,
        sifStatusChanged,
        mitigationEfficacy,
        impactFactors,
      },
      scenarioExplanation,
    });

    if (mongoose.connection.readyState === 1) {
      await simulationDoc.save();
    }

    return simulationDoc;
  }

  /**
   * List past simulations.
   */
  static async getSimulations(filters = {}) {
    if (mongoose.connection.readyState !== 1) {
      return [];
    }
    const query = {};
    if (filters.baseReportId) query.baseReportId = filters.baseReportId;
    return Simulation.find(query).sort({ createdAt: -1 });
  }

  /**
   * Get single simulation by ID.
   */
  static async getSimulationById(simulationId) {
    if (mongoose.connection.readyState !== 1) {
      throw new AppError(`Simulation '${simulationId}' not found`, 404, "SIMULATION_NOT_FOUND");
    }
    const sim = await Simulation.findOne({ simulationId });
    if (!sim) {
      throw new AppError(`Simulation '${simulationId}' not found`, 404, "SIMULATION_NOT_FOUND");
    }
    return sim;
  }

  /**
   * Compare multiple simulation snapshots side-by-side.
   */
  static async compareSimulations(simulationIds = []) {
    if (!simulationIds || simulationIds.length < 2) {
      throw new AppError("At least 2 simulation IDs required for comparison", 400, "INSUFFICIENT_SIMULATIONS");
    }

    const simulations = await Simulation.find({ simulationId: { $in: simulationIds } });
    if (simulations.length === 0) {
      throw new AppError("No matching simulations found for comparison", 404, "SIMULATIONS_NOT_FOUND");
    }

    const comparisonMatrix = simulations.map((sim) => ({
      simulationId: sim.simulationId,
      scenarioName: sim.scenarioName,
      baseReportId: sim.baseReportId,
      baselineScore: sim.baseline.riskScore,
      simulatedScore: sim.simulated.riskScore,
      scoreDifference: sim.delta.scoreDifference,
      baselineLevel: sim.baseline.riskLevel,
      simulatedLevel: sim.simulated.riskLevel,
      sifTransition: `${sim.baseline.sifClassification} ➔ ${sim.simulated.sifClassification}`,
      mitigationEfficacy: `${sim.delta.mitigationEfficacy}%`,
      explanation: sim.scenarioExplanation,
    }));

    return {
      count: comparisonMatrix.length,
      scenarios: comparisonMatrix,
    };
  }
}

export default WhatIfSimulatorService;
