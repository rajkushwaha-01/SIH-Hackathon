import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import { env } from "../../src/config/env.js";

const generateTestToken = (role = "HSE_OFFICER") => {
  return jwt.sign(
    {
      id: "60d0fe4f5311236168a109ca",
      email: "executive.viewer@safety.org",
      role,
      name: "Executive Safety Director",
    },
    env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

describe("Phase 15 - Executive Dashboard & Analytics API Integration Tests", () => {
  const token = generateTestToken();

  describe("GET /api/analytics/dashboard", () => {
    it("should reject unauthenticated request with 401", async () => {
      const res = await request(app).get("/api/analytics/dashboard");
      expect(res.status).toBe(401);
    });

    it("should return unified executive dashboard payload with 200", async () => {
      const res = await request(app)
        .get("/api/analytics/dashboard")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toHaveProperty("kpis");
      expect(res.body.data).toHaveProperty("bySite");
      expect(res.body.data).toHaveProperty("byPrecursor");
      expect(res.body.data).toHaveProperty("trends");
      expect(res.body.data).toHaveProperty("barrierHealth");
    });
  });

  describe("GET /api/analytics/kpis", () => {
    it("should return KPI summary with 200", async () => {
      const res = await request(app)
        .get("/api/analytics/kpis")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toHaveProperty("sifRate");
      expect(res.body.data).toHaveProperty("barrierHealthScore");
    });
  });

  describe("GET /api/analytics/barriers", () => {
    it("should return barrier health analytics with 200", async () => {
      const res = await request(app)
        .get("/api/analytics/barriers")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toHaveProperty("overallResilienceScore");
      expect(res.body.data).toHaveProperty("topFailedBarriers");
    });
  });
});
