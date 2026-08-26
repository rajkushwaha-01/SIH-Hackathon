import { Router } from "express";
import {
  getEnterpriseGraph,
  getHighRiskPathways,
  getPrecursorGraph,
  getReportGraph,
} from "../controllers/graph.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// All causal graph routes require authentication
router.use(authenticate);

// Enterprise-wide causal graph
router.get("/", getEnterpriseGraph);

// High-risk failure pathways
router.get("/pathways", getHighRiskPathways);

// Subgraph for specific precursor
router.get("/precursor/:type", getPrecursorGraph);

// Subgraph for specific incident report
router.get("/report/:reportId", getReportGraph);

export default router;
