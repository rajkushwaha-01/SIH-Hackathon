import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

let genAI = null;

export const getGeminiClient = () => {
  if (!genAI) {
    if (!env.GOOGLE_API_KEY || env.GOOGLE_API_KEY === "mock_google_api_key_for_testing") {
      logger.warn("Google Gemini API key not provided or in mock mode. Operating with deterministic fallback.");
      return null;
    }
    genAI = new GoogleGenerativeAI(env.GOOGLE_API_KEY);
    logger.info(`Google Generative AI client initialized for model: ${env.GEMINI_MODEL}`);
  }
  return genAI;
};

export const getGenerativeModel = (systemInstruction = "") => {
  const client = getGeminiClient();
  if (!client) return null;

  return client.getGenerativeModel({
    model: env.GEMINI_MODEL,
    systemInstruction: systemInstruction || undefined,
    generationConfig: {
      temperature: 0.1, // Low temperature for deterministic, factual safety analysis
      topP: 0.8,
      topK: 40,
      responseMimeType: "application/json",
    },
  });
};

export default {
  getGeminiClient,
  getGenerativeModel,
};
