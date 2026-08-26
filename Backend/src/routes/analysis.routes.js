import { Router } from "express";
import {
  triggerAnalysis,
  reanalyzeReport,
  getJobStatus,
  getAnalysisByReportId,
} from "../controllers/analysis.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// All analysis routes require authentication
router.use(authenticate);

// Trigger analysis for a report (Async Job)
router.post("/reports/:id/analyze", triggerAnalysis);

// Re-analyze a report (Synchronous force update)
router.post("/reports/:id/reanalyze", reanalyzeReport);

// Poll analysis job status
router.get("/jobs/:jobId", getJobStatus);

// Get latest analysis intelligence by report ID
router.get("/:reportId", getAnalysisByReportId);

export default router;
