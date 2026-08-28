import { Router } from "express";
import {
  runSimulation,
  getSimulations,
  getSimulationById,
  compareSimulations,
} from "../controllers/simulator.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validation.middleware.js";
import {
  runSimulationSchema,
  compareSimulationsSchema,
} from "../validators/simulation.validator.js";

const router = Router();

// All simulator routes require authentication
router.use(authenticate);

// Run counterfactual What-If risk simulation
router.post("/simulate", validateBody(runSimulationSchema), runSimulation);
router.post("/evaluate", validateBody(runSimulationSchema), runSimulation);

// Get simulation history
router.get("/", getSimulations);

// Get single simulation snapshot
router.get("/:id", getSimulationById);

// Multi-scenario comparison matrix
router.post("/compare", validateBody(compareSimulationsSchema), compareSimulations);

export default router;
