import { describe, it, expect, beforeEach } from "vitest";
import { RagContextBuilder } from "../../src/services/rag/RagContextBuilder.js";
import { VectorSearchService } from "../../src/services/vector/VectorSearchService.js";
import { PineconeService } from "../../src/services/vector/PineconeService.js";

describe("Phase 10 - RagContextBuilder Unit Tests", () => {
  beforeEach(() => {
    PineconeService.clearMemoryStore();
  });

  it("should assemble a complete grounded RAG context block with precedents and IOGP rules", async () => {
    // Seed an incident in vector search
    const mockReport = {
      reportId: "INC-RAG-01",
      sourceType: "TEXT",
      originalContent: "Electrician worked on 440V motor control center without LOTO or voltage testing.",
      normalizedReport: {
        title: "Electrical Near Miss",
        site: "Refinery Unit 4",
        activity: "Electrical Maintenance",
        location: "Substation B",
        reportType: "NEAR_MISS",
        eventDate: new Date("2026-03-15"),
      },
    };

    const mockAnalysis = {
      sifClassification: { classification: "SIF_POTENTIAL" },
      precursors: [{ type: "ELECTRICAL_EXPOSURE" }, { type: "ISOLATION_FAILURE" }],
      nlpExtraction: { hazards: [{ name: "Live Conductor" }] },
      riskScore: { score: 88 },
    };

    await VectorSearchService.indexReportVectors(mockReport, mockAnalysis);

    const ragContext = await RagContextBuilder.buildContextForQuery({
      query: "Live electrical circuit switchboard maintenance zero energy verification",
      topK: 2,
      minScore: 0.1,
    });

    expect(ragContext).toHaveProperty("formattedContext");
    expect(ragContext.formattedContext).toContain("GROUNDED SAFETY INTELLIGENCE CONTEXT");
    expect(ragContext.formattedContext).toContain("Report ID: INC-RAG-01");
    expect(ragContext.formattedContext).toContain("Energy Isolation");
    expect(ragContext.formattedContext).toContain("GROUNDING MANDATE");
    expect(ragContext.applicableRules.length).toBeGreaterThan(0);
  });

  it("should reject empty query string with 400 AppError", async () => {
    await expect(RagContextBuilder.buildContextForQuery({ query: "" })).rejects.toThrow();
  });
});
