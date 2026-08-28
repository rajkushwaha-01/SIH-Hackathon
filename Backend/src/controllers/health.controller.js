import mongoose from "mongoose";
import { sendSuccess } from "../utils/apiResponse.js";
import { env } from "../config/env.js";

const startTime = Date.now();

export const getHealth = (req, res) => {
  const dbStatusMap = {
    0: "DISCONNECTED",
    1: "CONNECTED",
    2: "CONNECTING",
    3: "DISCONNECTING",
  };

  const dbState = mongoose.connection.readyState;
  const dbStatus = dbStatusMap[dbState] || "UNKNOWN";

  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const memoryUsage = process.memoryUsage();

  const healthData = {
    status: dbState === 1 ? "HEALTHY" : "DEGRADED",
    service: "sih-sif-precursor-engine-backend",
    version: "1.0.0",
    environment: env.NODE_ENV,
    uptime: `${uptimeSeconds}s`,
    timestamp: new Date().toISOString(),
    components: {
      server: "ONLINE",
      database: {
        status: dbStatus,
        readyState: dbState,
      },
      aiModel: {
        model: env.GEMINI_MODEL,
        status: env.GOOGLE_API_KEY && env.GOOGLE_API_KEY !== "mock_google_api_key_for_testing" ? "CONFIGURED" : "NOT_CONFIGURED",
      },
      vectorDb: {
        index: env.PINECONE_INDEX,
        namespace: env.PINECONE_NAMESPACE,
        status: env.PINECONE_API_KEY && env.PINECONE_API_KEY !== "mock_pinecone_api_key_for_testing" ? "CONFIGURED" : "NOT_CONFIGURED",
      },
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      },
    },
  };

  const statusCode = dbState === 1 || env.NODE_ENV !== "production" ? 200 : 503;
  return sendSuccess(res, healthData, "System health status retrieved successfully", statusCode);
};

export default {
  getHealth,
};
