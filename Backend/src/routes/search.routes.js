import { Router } from "express";
import { semanticSearch } from "../controllers/search.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// All search endpoints require authentication
router.use(authenticate);

// Semantic similarity search with filters
router.post("/semantic", semanticSearch);

export default router;
