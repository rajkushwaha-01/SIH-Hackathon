import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import { env } from "../../src/config/env.js";

const generateTestToken = (role = "HSE_OFFICER") => {
  return jwt.sign(
    {
      id: "60d0fe4f5311236168a109ca",
      email: "hse.reviewer@safety.org",
      role,
      name: "HSE Senior Reviewer",
    },
    env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

describe("Phase 17 - Human-in-the-Loop Review API Integration Tests", () => {
  const token = generateTestToken("HSE_OFFICER");

  describe("GET /api/reports/:id/detail", () => {
    it("should reject unauthenticated request with 401", async () => {
      const res = await request(app).get("/api/reports/INC-2026-001/detail");
      expect(res.status).toBe(401);
    });

    it("should return unified 360-degree report detail with 200", async () => {
      const res = await request(app)
        .get("/api/reports/INC-2026-001/detail")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toHaveProperty("report");
      expect(res.body.data).toHaveProperty("latestAnalysis");
      expect(res.body.data).toHaveProperty("auditTrail");
    });
  });

  describe("POST /api/reports/:id/review", () => {
    it("should reject review without justification with 400", async () => {
      const res = await request(app)
        .post("/api/reports/INC-2026-001/review")
        .set("Authorization", `Bearer ${token}`)
        .send({
          decision: "APPROVE",
          justification: "short",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should submit human review approval with 200", async () => {
      const res = await request(app)
        .post("/api/reports/INC-2026-001/review")
        .set("Authorization", `Bearer ${token}`)
        .send({
          decision: "APPROVE",
          justification: "HSE review completed and verified against CCTV records.",
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toHaveProperty("reviewStatus", "APPROVED");
    });
  });

  describe("GET /api/reports/:id/audit-trail", () => {
    it("should return chronological audit trail entries with 200", async () => {
      const res = await request(app)
        .get("/api/reports/INC-2026-001/audit-trail")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
