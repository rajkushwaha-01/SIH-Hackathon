import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import { env } from "../../src/config/env.js";

const generateTestToken = (role = "HSE_OFFICER") => {
  return jwt.sign(
    {
      id: "60d0fe4f5311236168a109ca",
      email: "alert.manager@safety.org",
      role,
      name: "Alert Manager",
    },
    env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

describe("Phase 16 - Smart HSE Alerts API Integration Tests", () => {
  const token = generateTestToken();

  describe("GET /api/alerts", () => {
    it("should reject unauthenticated request with 401", async () => {
      const res = await request(app).get("/api/alerts");
      expect(res.status).toBe(401);
    });

    it("should return list of alerts with 200", async () => {
      const res = await request(app)
        .get("/api/alerts")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe("GET /api/alerts/stats", () => {
    it("should return alert statistics with 200", async () => {
      const res = await request(app)
        .get("/api/alerts/stats")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toHaveProperty("totalOpen");
    });
  });

  describe("PATCH /api/alerts/:id/acknowledge", () => {
    it("should acknowledge alert and return updated state with 200", async () => {
      const res = await request(app)
        .patch("/api/alerts/ALT-2026-0001/acknowledge")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("status", "ACKNOWLEDGED");
    });
  });
});
