import crypto from "crypto";
import { getGeminiClient } from "../../config/ai.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/appError.js";
import { logger } from "../../utils/logger.js";

export const EMBEDDING_DIMENSION = 768;
export const EMBEDDING_MODEL_NAME = env.EMBEDDING_MODEL || "gemini-embedding-001";

const embeddingCache = new Map();

export class EmbeddingService {
  /**
   * Generates a deterministic, word-aware 768-dimensional float vector for testing/offline mode.
   * Uses token hashing and n-grams so overlapping vocabulary produces high cosine similarity.
   */
  static generateDeterministicVector(text = "", dimension = EMBEDDING_DIMENSION) {
    const vector = new Array(dimension).fill(0);
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 1);

    if (words.length === 0) {
      vector[0] = 1.0;
      return vector;
    }

    // Add token hash weights
    for (const word of words) {
      const hash = crypto.createHash("sha256").update(word).digest();
      for (let i = 0; i < 4; i++) {
        const dimIndex = hash.readUInt16BE(i * 2) % dimension;
        vector[dimIndex] += 1.0;
      }
    }

    // Add character 3-gram weights for subword similarity
    const cleanStr = text.toLowerCase().replace(/\s+/g, " ").trim();
    for (let i = 0; i <= cleanStr.length - 3; i++) {
      const trigram = cleanStr.substring(i, i + 3);
      const hash = crypto.createHash("md5").update(trigram).digest();
      const dimIndex = hash.readUInt16BE(0) % dimension;
      vector[dimIndex] += 0.2;
    }

    // Normalize to unit length (L2 norm) for cosine similarity
    let sumSquares = 0;
    for (let i = 0; i < dimension; i++) {
      sumSquares += vector[i] * vector[i];
    }

    const norm = Math.sqrt(sumSquares) || 1.0;
    return vector.map((v) => parseFloat((v / norm).toFixed(6)));
  }

  /**
   * Generate vector embedding for a single string.
   */
  static async generateEmbedding(text = "") {
    if (!text || typeof text !== "string" || !text.trim()) {
      throw new AppError("Cannot generate embedding for empty text", 400, "EMPTY_EMBEDDING_TEXT");
    }

    const cacheKey = crypto.createHash("sha256").update(text.trim()).digest("hex");
    if (embeddingCache.has(cacheKey)) {
      const cached = embeddingCache.get(cacheKey);
      return {
        embedding: cached.embedding,
        dimension: cached.dimension,
        model: cached.model,
        cached: true,
      };
    }

    const client = getGeminiClient();

    if (!client) {
      throw new AppError(
        "Google AI client is not configured for vector embeddings. Please ensure GOOGLE_API_KEY is set in your environment.",
        503,
        "EMBEDDING_SERVICE_UNAVAILABLE"
      );
    }

    const modelName = env.EMBEDDING_MODEL || "gemini-embedding-001";
    let attempts = 0;
    const maxRetries = 3;
    let lastError = null;

    while (attempts < maxRetries) {
      attempts++;
      try {
        const embeddingModel = client.getGenerativeModel({ model: modelName });
        
        // Request embedding with outputDimensionality set to match target EMBEDDING_DIMENSION (768)
        const result = await embeddingModel.embedContent({
          content: { parts: [{ text }] },
          outputDimensionality: EMBEDDING_DIMENSION,
        });

        const vector = result.embedding?.values;

        if (!vector || !Array.isArray(vector) || vector.length === 0) {
          throw new Error("Empty vector values returned by embedding model");
        }

        let sumSquares = 0;
        for (let i = 0; i < vector.length; i++) {
          sumSquares += vector[i] * vector[i];
        }
        const norm = Math.sqrt(sumSquares) || 1.0;
        const normalizedVector = vector.map((v) => parseFloat((v / norm).toFixed(6)));

        embeddingCache.set(cacheKey, {
          embedding: normalizedVector,
          dimension: normalizedVector.length,
          model: modelName,
        });

        return {
          embedding: normalizedVector,
          dimension: normalizedVector.length,
          model: modelName,
        };
      } catch (error) {
        lastError = error;
        const isRateLimit = error.message?.includes("429") || error.message?.includes("Too Many Requests") || error.message?.includes("quota");
        
        if (isRateLimit && attempts < maxRetries) {
          const delayMs = attempts * 5000;
          logger.warn(`[EmbeddingService] Rate limited (429). Retrying attempt ${attempts}/${maxRetries} after ${delayMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        logger.error("[EmbeddingService] Embedding request failed", {
          provider: "GoogleGenerativeAI",
          model: modelName,
          inputLength: text.length,
          apiKeyConfigured: !!(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || env.GOOGLE_API_KEY),
          pineconeIndex: env.PINECONE_INDEX,
          pineconeNamespace: env.PINECONE_NAMESPACE,
          vectorDimension: EMBEDDING_DIMENSION,
          attempt: attempts,
          error: error.message,
          stack: error.stack,
        });

        throw new AppError(`Vector embedding generation failed: ${error.message}`, 502, "EMBEDDING_FAILED");
      }
    }
  }

  /**
   * Generate vector embeddings for an array of texts in batch.
   */
  static async generateBatchEmbeddings(texts = []) {
    if (!Array.isArray(texts) || texts.length === 0) {
      return [];
    }

    const results = [];
    for (const text of texts) {
      const res = await EmbeddingService.generateEmbedding(text);
      results.push(res);
    }

    return results;
  }
}

export default EmbeddingService;
