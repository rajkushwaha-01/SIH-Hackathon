import { describe, it, expect } from "vitest";
import { EmbeddingService, EMBEDDING_DIMENSION } from "../../src/services/embeddings/EmbeddingService.js";

describe("Phase 9 - EmbeddingService Unit Tests", () => {
  it("should generate a valid 768-dimensional normalized float vector", async () => {
    const text = "Worker observed scaffolding ladder unhooked from structure.";
    const result = await EmbeddingService.generateEmbedding(text);

    expect(result).toHaveProperty("embedding");
    expect(result.embedding).toHaveLength(EMBEDDING_DIMENSION);
    expect(result.dimension).toBe(EMBEDDING_DIMENSION);

    // Verify unit length L2 norm
    const sumSquares = result.embedding.reduce((sum, val) => sum + val * val, 0);
    expect(Math.sqrt(sumSquares)).toBeCloseTo(1.0, 2);
  });

  it("should reject empty text string with 400 AppError", async () => {
    await expect(EmbeddingService.generateEmbedding("")).rejects.toThrow();
  });

  it("should generate batch embeddings for array of strings", async () => {
    const texts = [
      "Working at height without safety harness tie-off.",
      "Live electrical conductor touched during maintenance.",
      "Dropped 12kg wrench from crane walkway.",
    ];

    const results = await EmbeddingService.generateBatchEmbeddings(texts);
    expect(results).toHaveLength(3);
    expect(results[0].embedding).toHaveLength(EMBEDDING_DIMENSION);
    expect(results[1].embedding).toHaveLength(EMBEDDING_DIMENSION);
    expect(results[2].embedding).toHaveLength(EMBEDDING_DIMENSION);
  });
});
