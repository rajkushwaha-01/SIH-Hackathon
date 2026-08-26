import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { requestLogger } from "./middleware/requestLogger.middleware.js";
import { apiLimiter } from "./middleware/rateLimiter.middleware.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.middleware.js";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import reportRoutes from "./routes/report.routes.js";
import analysisRoutes from "./routes/analysis.routes.js";
import precursorRoutes from "./routes/precursor.routes.js";
import lifeSavingRuleRoutes from "./routes/lifeSavingRule.routes.js";
import searchRoutes from "./routes/search.routes.js";
import patternRoutes from "./routes/pattern.routes.js";
import graphRoutes from "./routes/graph.routes.js";
import simulatorRoutes from "./routes/simulator.routes.js";
import copilotRoutes from "./routes/copilot.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import alertRoutes from "./routes/alert.routes.js";

const app = express();

// Security and HTTP headers
app.disable("x-powered-by");

// Enable CORS
app.use(
  cors({
    origin: env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN.split(",").map((o) => o.trim()),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Body Parsers
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Request Logging
app.use(requestLogger);

// Rate Limiting
app.use("/api", apiLimiter);

// API Routes
app.use("/", healthRoutes);
app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/precursors", precursorRoutes);
app.use("/api/life-saving-rules", lifeSavingRuleRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/patterns", patternRoutes);
app.use("/api/graph", graphRoutes);
app.use("/api/simulator", simulatorRoutes);
app.use("/api/copilot", copilotRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/alerts", alertRoutes);

// 404 Catch-All Handler
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

export default app;
