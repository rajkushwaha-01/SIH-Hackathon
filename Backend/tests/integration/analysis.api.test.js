import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import { env } from "../../src/config/env.js";

const generateTestToken = (role = "HSE_OFFICER") => {
  return jwt.sign(
    {
      id: "60d0fe4f5311236168a109ca",
      email: "hse.analyst@safety.org",
      role,
      name: "HSE Analyst",
    },
    env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

describe("Phase 4 - Analysis API Integration Tests", () => {
  const token = generateTestToken();

  describe("Authentication Gate", () => {
    it("should reject unauthenticated POST /api/reports/:id/analyze with 401", async () => {
      const res = await request(app).post("/api/reports/INC-2026-001/analyze");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("should reject unauthenticated POST /api/reports/:id/reanalyze with 401", async () => {
      const res = await request(app).post("/api/reports/INC-2026-001/reanalyze");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("should reject unauthenticated GET /api/analysis/jobs/:jobId with 401", async () => {
      const res = await request(app).get("/api/analysis/jobs/JOB-123");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("should reject unauthenticated GET /api/analysis/:reportId with 401", async () => {
      const res = await request(app).get("/api/analysis/INC-2026-001");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });
});
