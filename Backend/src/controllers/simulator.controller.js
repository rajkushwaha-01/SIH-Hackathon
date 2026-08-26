import { WhatIfSimulatorService } from "../services/simulator/WhatIfSimulatorService.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const runSimulation = async (req, res, next) => {
  try {
    const simulation = await WhatIfSimulatorService.simulateScenario({
      ...req.body,
      userId: req.user?.id,
    });
    return sendSuccess(res, simulation, "What-If risk simulation completed", 200);
  } catch (error) {
    next(error);
  }
};

export const getSimulations = async (req, res, next) => {
  try {
    const simulations = await WhatIfSimulatorService.getSimulations(req.query);
    return sendSuccess(res, simulations, "Simulation history retrieved", 200);
  } catch (error) {
    next(error);
  }
};

export const getSimulationById = async (req, res, next) => {
  try {
    const simulation = await WhatIfSimulatorService.getSimulationById(req.params.id);
    return sendSuccess(res, simulation, `Simulation snapshot for ${req.params.id}`, 200);
  } catch (error) {
    next(error);
  }
};

export const compareSimulations = async (req, res, next) => {
  try {
    const comparison = await WhatIfSimulatorService.compareSimulations(req.body.simulationIds);
    return sendSuccess(res, comparison, "Multi-scenario simulation comparison matrix", 200);
  } catch (error) {
    next(error);
  }
};

export default {
  runSimulation,
  getSimulations,
  getSimulationById,
  compareSimulations,
};
