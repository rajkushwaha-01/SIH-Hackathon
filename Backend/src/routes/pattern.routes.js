import { Router } from "express";
import {
  detectPatterns,
  getPatterns,
  getPatternById,
  updatePatternStatus,
} from "../controllers/pattern.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// All pattern routes require authentication
router.use(authenticate);

// List all discovered patterns
router.get("/", getPatterns);

// Trigger manual pattern mining / refresh
router.post("/detect", requireRole("ADMIN", "HSE_OFFICER"), detectPatterns);

// Get single pattern details
router.get("/:id", getPatternById);

// Update pattern lifecycle status (ACTIVE, MITIGATED, etc.)
router.patch("/:id/status", requireRole("ADMIN", "HSE_OFFICER"), updatePatternStatus);

export default router;
