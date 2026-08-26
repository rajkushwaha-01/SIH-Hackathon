import { describe, it, expect, beforeEach } from "vitest";
import { VectorSearchService } from "../../src/services/vector/VectorSearchService.js";
import { PineconeService } from "../../src/services/vector/PineconeService.js";

describe("Phase 9 - VectorSearchService Unit Tests", () => {
  beforeEach(() => {
    PineconeService.clearMemoryStore();
  });

  it("should index report chunks into Pinecone and retrieve via searchSimilar", async () => {
    const report1 = {
      reportId: "INC-VEC-01",
      sourceType: "PDF",
      originalContent: "Scaffolder dropped a 5kg scaffolding wrench from 8m platform. Lanyard was not attached.",
      normalizedReport: {
        title: "Dropped Tool Near Miss",
        site: "Site Gamma",
        activity: "Scaffolding",
        location: "Module B",
        reportType: "NEAR_MISS",
        eventDate: new Date(),
      },
    };

    const analysis1 = {
      sifClassification: { classification: "SIF_POTENTIAL" },
      precursors: [{ type: "DROPPED_OBJECTS" }, { type: "WORKING_AT_HEIGHT" }],
      nlpExtraction: { hazards: [{ name: "Dropped Tool" }] },
      riskScore: { score: 85 },
    };

    // Index report vectors
    const indexResult = await VectorSearchService.indexReportVectors(report1, analysis1);
    expect(indexResult.count).toBeGreaterThan(0);

    // Search similar
    const searchResults = await VectorSearchService.searchSimilar({
      queryText: "wrench dropped from high platform scaffolding",
      topK: 3,
      minScore: 0.1,
    });

    expect(searchResults.length).toBeGreaterThan(0);
    expect(searchResults[0].reportId).toBe("INC-VEC-01");
    expect(searchResults[0].matchingFactors).toContain("Site Gamma");
    expect(searchResults[0].matchingFactors).toContain("DROPPED_OBJECTS");
  });

  it("should exclude target reportId when requested", async () => {
    const report = {
      reportId: "INC-VEC-SELF",
      sourceType: "TEXT",
      originalContent: "Unsafe electrical condition reported.",
      normalizedReport: {
        site: "Site Delta",
        activity: "Electrical",
        location: "MCC",
        reportType: "OBSERVATION",
        eventDate: new Date(),
      },
    };

    await VectorSearchService.indexReportVectors(report);

    const searchResults = await VectorSearchService.searchSimilar({
      queryText: "Unsafe electrical condition",
      excludeReportId: "INC-VEC-SELF",
      minScore: 0.1,
    });

    expect(searchResults.some((r) => r.reportId === "INC-VEC-SELF")).toBe(false);
  });
});
