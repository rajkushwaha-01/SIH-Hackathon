import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import { env } from "../../src/config/env.js";

const generateTestToken = (role = "HSE_OFFICER") => {
  return jwt.sign(
    {
      id: "60d0fe4f5311236168a109ca",
      email: "hse.lead@safety.org",
      role,
      name: "HSE Lead",
    },
    env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

describe("Phase 11 - Pattern API Integration Tests", () => {
  const token = generateTestToken("HSE_OFFICER");

  describe("GET /api/patterns", () => {
    it("should reject unauthenticated request with 401", async () => {
      const res = await request(app).get("/api/patterns");
      expect(res.status).toBe(401);
    });

    it("should return recurring safety patterns with 200", async () => {
      const res = await request(app)
        .get("/api/patterns")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe("POST /api/patterns/detect", () => {
    it("should trigger pattern detection analysis with 200", async () => {
      const res = await request(app)
        .post("/api/patterns/detect")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toHaveProperty("patterns");
    });
  });

  describe("PATCH /api/patterns/:id/status", () => {
    it("should reject invalid status with 400", async () => {
      const res = await request(app)
        .patch("/api/patterns/PAT-2026-001/status")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "INVALID_STATUS_XYZ" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_STATUS");
    });
  });
});
