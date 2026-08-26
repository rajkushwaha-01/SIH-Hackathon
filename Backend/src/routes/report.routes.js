import { Router } from "express";
import {
  uploadReport,
  createReport,
  getReports,
  getReportById,
  deleteReport,
} from "../controllers/report.controller.js";
import {
  triggerReportAnalysis,
  reanalyzeReport,
  getAnalysisByReportId,
} from "../controllers/analysis.controller.js";
import { getSimilarReports } from "../controllers/search.controller.js";
import {
  getReportDetail,
  submitReview,
  getAuditTrail,
} from "../controllers/review.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { uploadSingleReport } from "../middleware/upload.middleware.js";
import { validateBody } from "../middleware/validation.middleware.js";
import {
  createReportSchema,
  reanalyzeSchema,
} from "../validators/report.validator.js";
import { reviewSubmissionSchema } from "../validators/review.validator.js";

const router = Router();

// All report routes require authentication
router.use(authenticate);

// List & Create Reports
router.get("/", getReports);
router.post("/", validateBody(createReportSchema), createReport);
router.post("/upload", uploadSingleReport, uploadReport);

// Individual Report Endpoints
router.get("/:id", getReportById);
router.delete("/:id", requireRole("ADMIN"), deleteReport);

// 360-Degree Unified Detail Payload
router.get("/:id/detail", getReportDetail);

// Human-in-the-Loop Review & Overrides
router.post(
  "/:id/review",
  requireRole("ADMIN", "HSE_OFFICER", "REVIEWER"),
  validateBody(reviewSubmissionSchema),
  submitReview
);

// Audit Trail & Similar Reports
router.get("/:id/audit-trail", getAuditTrail);
router.get("/:id/similar", getSimilarReports);

// Analysis Operations for Specific Report
router.post("/:id/analyze", requireRole("ADMIN", "HSE_OFFICER"), triggerReportAnalysis);
router.post("/:id/reanalyze", requireRole("ADMIN", "HSE_OFFICER"), validateBody(reanalyzeSchema), reanalyzeReport);
router.get("/:id/analysis", getAnalysisByReportId);

export default router;
