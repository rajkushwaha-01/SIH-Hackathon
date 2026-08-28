import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

let genAI = null;

export const getGeminiClient = () => {
  if (!genAI) {
    const rawKey = (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || env.GOOGLE_API_KEY || "")
      .trim()
      .replace(/^['"]|['"]$/g, "");

    if (!rawKey || rawKey === "mock_google_api_key_for_testing" || rawKey.startsWith("mock_")) {
      logger.warn("Google Gemini API key not provided or in mock mode. Operating with deterministic fallback.");
      return null;
    }
    genAI = new GoogleGenerativeAI(rawKey);
    logger.info(`Google Generative AI client initialized for model: ${env.GEMINI_MODEL}`);
  }
  return genAI;
};

export const getGenerativeModel = (systemInstruction = "", options = {}) => {
  const client = getGeminiClient();
  if (!client) return null;

  const responseMimeType = options.responseMimeType || (options.isText ? "text/plain" : "application/json");

  return client.getGenerativeModel({
    model: options.model || (env.GEMINI_MODEL === "gemini-2.5-flash" ? "gemini-1.5-flash" : env.GEMINI_MODEL),
    systemInstruction: systemInstruction || undefined,
    generationConfig: {
      temperature: options.temperature !== undefined ? options.temperature : 0.1,
      topP: options.topP || 0.8,
      topK: options.topK || 40,
      responseMimeType,
    },
  });
};

export default {
  getGeminiClient,
  getGenerativeModel,
};
