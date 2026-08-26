import { describe, it, expect, beforeEach } from "vitest";
import { PineconeService, cosineSimilarity } from "../../src/services/vector/PineconeService.js";
import { EmbeddingService } from "../../src/services/embeddings/EmbeddingService.js";

describe("Phase 9 - PineconeService Unit Tests", () => {
  beforeEach(() => {
    PineconeService.clearMemoryStore();
  });

  it("should calculate correct cosine similarity between identical and orthogonal vectors", () => {
    const vecA = [1, 0, 0];
    const vecB = [1, 0, 0];
    const vecC = [0, 1, 0];

    expect(cosineSimilarity(vecA, vecB)).toBe(1.0);
    expect(cosineSimilarity(vecA, vecC)).toBe(0.0);
  });

  it("should upsert vector records and query matches by cosine similarity", async () => {
    const text1 = "Fall from height during scaffold erection";
    const text2 = "Electrical arc flash in switchgear room";

    const { embedding: emb1 } = await EmbeddingService.generateEmbedding(text1);
    const { embedding: emb2 } = await EmbeddingService.generateEmbedding(text2);

    const records = [
      { id: "chunk_1", values: emb1, metadata: { site: "Site Alpha", precursor: "WORKING_AT_HEIGHT" } },
      { id: "chunk_2", values: emb2, metadata: { site: "Site Beta", precursor: "ELECTRICAL_EXPOSURE" } },
    ];

    await PineconeService.upsertVectors(records);

    // Query with vector 1
    const results = await PineconeService.queryVectors({
      vector: emb1,
      topK: 2,
    });

    expect(results.length).toBe(2);
    expect(results[0].id).toBe("chunk_1");
    expect(results[0].score).toBeCloseTo(1.0, 2);
  });

  it("should apply metadata filtering during vector query", async () => {
    const { embedding } = await EmbeddingService.generateEmbedding("General query");

    const records = [
      { id: "chunk_A", values: embedding, metadata: { site: "Site Alpha", sifStatus: "SIF_POTENTIAL" } },
      { id: "chunk_B", values: embedding, metadata: { site: "Site Beta", sifStatus: "NON_SIF" } },
    ];

    await PineconeService.upsertVectors(records);

    const results = await PineconeService.queryVectors({
      vector: embedding,
      topK: 5,
      filter: { site: "Site Alpha" },
    });

    expect(results.length).toBe(1);
    expect(results[0].id).toBe("chunk_A");
  });

  it("should delete vector records by ID", async () => {
    const { embedding } = await EmbeddingService.generateEmbedding("Test delete");
    await PineconeService.upsertVectors([{ id: "chunk_del", values: embedding, metadata: {} }]);

    const delResult = await PineconeService.deleteVectors(["chunk_del"]);
    expect(delResult.deleted).toBe(1);

    const queryResult = await PineconeService.queryVectors({ vector: embedding, topK: 5 });
    expect(queryResult.length).toBe(0);
  });
});
