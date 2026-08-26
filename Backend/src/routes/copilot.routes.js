import { Router } from "express";
import {
  createSession,
  getSessions,
  getSessionById,
  deleteSession,
  chat,
  chatStream,
} from "../controllers/copilot.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// All copilot endpoints require authentication
router.use(authenticate);

// Session Management
router.post("/sessions", createSession);
router.get("/sessions", getSessions);
router.get("/sessions/:sessionId", getSessionById);
router.delete("/sessions/:sessionId", deleteSession);

// Multi-turn grounded chat
router.post("/chat", chat);

// Real-time SSE streaming chat
router.post("/chat/stream", chatStream);

export default router;
