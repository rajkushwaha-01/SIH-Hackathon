import { Router } from "express";
import {
  getTaxonomy,
  getPrecursorByType,
  getPrecursorAnalytics,
} from "../controllers/precursor.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// All precursor routes require authentication
router.use(authenticate);

// List full 14-category taxonomy
router.get("/", getTaxonomy);

// Get definition and metadata for specific precursor type
router.get("/:type", getPrecursorByType);

// Get occurrence analytics for a precursor type
router.get("/:type/analytics", getPrecursorAnalytics);

export default router;
