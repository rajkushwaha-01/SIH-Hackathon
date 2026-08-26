import { Router } from "express";
import {
  getAlerts,
  getAlertById,
  acknowledgeAlert,
  resolveAlert,
  dismissAlert,
  getAlertStats,
} from "../controllers/alert.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// All alert endpoints require authentication
router.use(authenticate);

// List all alerts with filters
router.get("/", getAlerts);

// Alert summary statistics
router.get("/stats", getAlertStats);

// Get single alert by ID
router.get("/:id", getAlertById);

// Lifecycle actions
router.patch("/:id/acknowledge", requireRole("ADMIN", "HSE_OFFICER", "REVIEWER"), acknowledgeAlert);
router.patch("/:id/resolve", requireRole("ADMIN", "HSE_OFFICER"), resolveAlert);
router.patch("/:id/dismiss", requireRole("ADMIN", "HSE_OFFICER"), dismissAlert);

export default router;
