import { Router } from "express";
import {
  getDashboard,
  getKpis,
  getSiteBreakdown,
  getPrecursorBreakdown,
  getTrends,
  getBarrierHealth,
} from "../controllers/analytics.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// All analytics endpoints require authentication
router.use(authenticate);

// Unified Executive Dashboard Payload
router.get("/dashboard", getDashboard);

// Specific metric queries
router.get("/kpis", getKpis);
router.get("/by-site", getSiteBreakdown);
router.get("/by-precursor", getPrecursorBreakdown);
router.get("/trends", getTrends);
router.get("/barriers", getBarrierHealth);

export default router;
