import crypto from "crypto";
import { getGeminiClient } from "../../config/ai.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/appError.js";
import { logger } from "../../utils/logger.js";

export const EMBEDDING_DIMENSION = 768;
export const EMBEDDING_MODEL_NAME = "text-embedding-004";

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

    const client = getGeminiClient();

    // Fallback to deterministic pseudo-vector if API key is not configured or in test mode
    if (!client || env.GOOGLE_API_KEY === "mock_google_api_key_for_testing" || env.NODE_ENV === "test") {
      return {
        embedding: EmbeddingService.generateDeterministicVector(text, EMBEDDING_DIMENSION),
        dimension: EMBEDDING_DIMENSION,
        model: "deterministic-word-embedding-004",
      };
    }

    try {
      const embeddingModel = client.getGenerativeModel({ model: EMBEDDING_MODEL_NAME });
      const result = await embeddingModel.embedContent(text);
      const vector = result.embedding.values;

      if (!vector || vector.length === 0) {
        throw new Error("Empty vector values returned by embedding model");
      }

      return {
        embedding: vector,
        dimension: vector.length,
        model: EMBEDDING_MODEL_NAME,
      };
    } catch (error) {
      logger.warn(`Gemini embedding API failed: ${error.message}. Falling back to deterministic vector.`);
      return {
        embedding: EmbeddingService.generateDeterministicVector(text, EMBEDDING_DIMENSION),
        dimension: EMBEDDING_DIMENSION,
        model: "deterministic-word-embedding-004",
      };
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
