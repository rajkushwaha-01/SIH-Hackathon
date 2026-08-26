import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import { env } from "../../src/config/env.js";
import { VectorSearchService } from "../../src/services/vector/VectorSearchService.js";
import { PineconeService } from "../../src/services/vector/PineconeService.js";

const generateTestToken = (role = "HSE_OFFICER") => {
  return jwt.sign(
    {
      id: "60d0fe4f5311236168a109ca",
      email: "hse.investigator@safety.org",
      role,
      name: "HSE Investigator",
    },
    env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

describe("Phase 10 - Search API Integration Tests", () => {
  const token = generateTestToken();

  beforeEach(() => {
    PineconeService.clearMemoryStore();
  });

  describe("POST /api/search/semantic", () => {
    it("should reject unauthenticated request with 401", async () => {
      const res = await request(app)
        .post("/api/search/semantic")
        .send({ query: "Working at height fall hazard" });

      expect(res.status).toBe(401);
    });

    it("should reject request with empty query string with 400", async () => {
      const res = await request(app)
        .post("/api/search/semantic")
        .set("Authorization", `Bearer ${token}`)
        .send({ query: "" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_QUERY");
    });

    it("should perform semantic search and return structured matches", async () => {
      // Seed a vector record
      const report = {
        reportId: "INC-SRCH-01",
        sourceType: "TEXT",
        originalContent: "Scaffolder dropped heavy ratchet wrench from 12m height.",
        normalizedReport: {
          title: "Dropped Ratchet Wrench",
          site: "Module C",
          activity: "Scaffolding",
          location: "Structure Top",
          reportType: "NEAR_MISS",
          eventDate: new Date(),
        },
      };

      await VectorSearchService.indexReportVectors(report);

      const res = await request(app)
        .post("/api/search/semantic")
        .set("Authorization", `Bearer ${token}`)
        .send({
          query: "wrench dropped from high platform scaffolding",
          topK: 5,
          minScore: 0.1,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toHaveProperty("results");
      expect(res.body.data.results.length).toBeGreaterThan(0);
      expect(res.body.data.results[0].reportId).toBe("INC-SRCH-01");
    });
  });

  describe("GET /api/reports/:id/similar", () => {
    it("should return 404 for non-existent reportId", async () => {
      const res = await request(app)
        .get("/api/reports/NON_EXISTENT_REP_999/similar")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("REPORT_NOT_FOUND");
    });
  });
});
