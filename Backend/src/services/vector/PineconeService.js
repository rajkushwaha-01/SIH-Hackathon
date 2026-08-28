import { Pinecone } from "@pinecone-database/pinecone";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

// In-memory mock vector store for offline/testing resilience
const inMemoryVectorStore = new Map();

let pineconeClient = null;

export const getPineconeClient = () => {
  if (!pineconeClient) {
    const rawKey = (process.env.PINECONE_API_KEY || env.PINECONE_API_KEY || "")
      .trim()
      .replace(/^['"]|['"]$/g, "");

    if (!rawKey || rawKey === "mock_pinecone_api_key_for_testing" || rawKey.startsWith("mock_")) {
      logger.warn("Pinecone API key not configured or in mock mode. Using resilient in-memory vector store.");
      return null;
    }
    try {
      pineconeClient = new Pinecone({ apiKey: rawKey });
      logger.info("Pinecone client initialized successfully.");
    } catch (err) {
      logger.error("Failed to initialize Pinecone client:", err);
      pineconeClient = null;
    }
  }
  return pineconeClient;
};

/**
 * Calculates cosine similarity between two float vectors.
 */
export const cosineSimilarity = (vecA = [], vecB = []) => {
  if (!vecA.length || !vecB.length || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator > 0 ? parseFloat((dotProduct / denominator).toFixed(4)) : 0;
};

export class PineconeService {
  /**
   * Upsert an array of vector records into Pinecone namespace.
   * Record format: { id: string, values: number[], metadata: object }
   */
  static async upsertVectors(records = [], namespace = env.PINECONE_NAMESPACE) {
    if (!records || records.length === 0) return { count: 0 };

    const client = getPineconeClient();

    // Store in in-memory vector store for fallback / testing
    for (const record of records) {
      inMemoryVectorStore.set(`${namespace}:${record.id}`, record);
    }

    if (!client || env.NODE_ENV === "test") {
      logger.info(`[Mock VectorStore] Upserted ${records.length} vectors into namespace '${namespace}'`);
      return { count: records.length, status: "UPSERTED_MOCK" };
    }

    try {
      const index = client.index(env.PINECONE_INDEX);
      await index.namespace(namespace).upsert(records);
      logger.info(`[Pinecone] Successfully upserted ${records.length} vectors to index '${env.PINECONE_INDEX}'`);
      return { count: records.length, status: "UPSERTED" };
    } catch (error) {
      logger.error(`[Pinecone] Upsert failed: ${error.message}. Vectors preserved in local fallback store.`);
      return { count: records.length, status: "UPSERTED_FALLBACK", error: error.message };
    }
  }

  /**
   * Query top-K vectors with optional metadata filters.
   */
  static async queryVectors({
    vector = [],
    topK = 10,
    filter = null,
    namespace = env.PINECONE_NAMESPACE,
  }) {
    const client = getPineconeClient();

    if (!client || env.NODE_ENV === "test") {
      return PineconeService.queryInMemoryStore({ vector, topK, filter, namespace });
    }

    try {
      const index = client.index(env.PINECONE_INDEX);
      const queryOptions = {
        vector,
        topK,
        includeMetadata: true,
        includeValues: false,
      };

      if (filter && Object.keys(filter).length > 0) {
        queryOptions.filter = filter;
      }

      const response = await index.namespace(namespace).query(queryOptions);
      return (response.matches || []).map((m) => ({
        id: m.id,
        score: m.score,
        metadata: m.metadata || {},
      }));
    } catch (error) {
      logger.warn(`[Pinecone] Remote query failed (${error.message}). Falling back to in-memory vector store.`);
      return PineconeService.queryInMemoryStore({ vector, topK, filter, namespace });
    }
  }

  /**
   * Query local in-memory vector store using cosine similarity and metadata filters.
   */
  static queryInMemoryStore({ vector, topK, filter, namespace }) {
    const matches = [];

    for (const [key, record] of inMemoryVectorStore.entries()) {
      if (key.startsWith(`${namespace}:`)) {
        // Evaluate metadata filter if present
        let passesFilter = true;
        if (filter) {
          for (const [fKey, fVal] of Object.entries(filter)) {
            if (record.metadata?.[fKey] !== undefined && record.metadata[fKey] !== fVal) {
              passesFilter = false;
              break;
            }
          }
        }

        if (passesFilter) {
          const score = cosineSimilarity(vector, record.values);
          matches.push({
            id: record.id,
            score,
            metadata: record.metadata || {},
          });
        }
      }
    }

    // Sort descending by cosine similarity score and take topK
    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, topK);
  }

  /**
   * Delete vector records by IDs from namespace.
   */
  static async deleteVectors(ids = [], namespace = env.PINECONE_NAMESPACE) {
    if (!ids || ids.length === 0) return { deleted: 0 };

    for (const id of ids) {
      inMemoryVectorStore.delete(`${namespace}:${id}`);
    }

    const client = getPineconeClient();
    if (!client || env.NODE_ENV === "test") {
      return { deleted: ids.length, status: "DELETED_MOCK" };
    }

    try {
      const index = client.index(env.PINECONE_INDEX);
      await index.namespace(namespace).deleteMany(ids);
      return { deleted: ids.length, status: "DELETED" };
    } catch (error) {
      logger.error(`[Pinecone] Delete failed: ${error.message}`);
      return { deleted: ids.length, status: "DELETED_FALLBACK", error: error.message };
    }
  }

  /**
   * Clear in-memory vector store (useful for tests).
   */
  static clearMemoryStore() {
    inMemoryVectorStore.clear();
  }
}

export default PineconeService;
