import { Router } from "express";
import {
  getRules,
  getRuleById,
  getRuleAnalytics,
} from "../controllers/lifeSavingRule.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// All Life-Saving Rule endpoints require authentication
router.use(authenticate);

// Get all 9 official IOGP Life-Saving Rules
router.get("/", getRules);

// Get single rule details by ruleId (e.g. IOGP-LSR-04) or code (e.g. ENERGY_ISOLATION)
router.get("/:id", getRuleById);

// Get incident occurrence analytics for a rule
router.get("/:id/analytics", getRuleAnalytics);

export default router;
