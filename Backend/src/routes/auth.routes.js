import { Router } from "express";
import { register, login, getMe } from "../controllers/auth.controller.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// Public routes
router.post("/register", validateRequest({ body: registerSchema }), register);
router.post("/login", validateRequest({ body: loginSchema }), login);

// Protected routes
router.get("/me", authenticate, getMe);

export default router;
