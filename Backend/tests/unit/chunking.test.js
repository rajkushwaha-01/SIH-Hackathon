import { describe, it, expect } from "vitest";
import { ChunkingService } from "../../src/services/nlp/ChunkingService.js";

describe("Phase 9 - ChunkingService Unit Tests", () => {
  it("should split long text into overlapping chunks", () => {
    const longParagraph = "A".repeat(400) + " " + "B".repeat(400);
    const segments = ChunkingService.splitTextIntoSegments(longParagraph, 500, 80);

    expect(segments.length).toBeGreaterThanOrEqual(2);
    expect(segments[0].length).toBeLessThanOrEqual(500);
  });

  it("should estimate token count accurately (1 token ~= 4 chars)", () => {
    const text = "This is a safety report observation.";
    const count = ChunkingService.estimateTokenCount(text);
    expect(count).toBe(Math.ceil(text.length / 4));
  });

  it("should create DocumentChunk objects preserving report metadata", async () => {
    const mockReport = {
      reportId: "INC-CHUNK-01",
      sourceType: "PDF",
      originalContent: "Technician was replacing high pressure valve on Deck 3 when trapped gas escaped.",
      normalizedReport: {
        site: "Offshore Platform Alpha",
        activity: "Valve Replacement",
        location: "Deck 3",
        reportType: "NEAR_MISS",
        eventDate: new Date(),
      },
    };

    const mockAnalysis = {
      sifClassification: { classification: "SIF_POTENTIAL" },
      precursors: [{ type: "PRESSURE_RELEASE" }],
      nlpExtraction: { hazards: [{ name: "Trapped Gas" }] },
      riskScore: { score: 82 },
    };

    const chunks = await ChunkingService.createChunks(mockReport, mockAnalysis);

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].chunkId).toBe("chunk_INC-CHUNK-01_001");
    expect(chunks[0].metadata.site).toBe("Offshore Platform Alpha");
    expect(chunks[0].metadata.sifStatus).toBe("SIF_POTENTIAL");
    expect(chunks[0].metadata.precursors).toContain("PRESSURE_RELEASE");
    expect(chunks[0].embeddingDimension).toBe(768);
  });
});
