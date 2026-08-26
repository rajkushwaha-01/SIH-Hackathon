import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import { env } from "../../src/config/env.js";

const generateTestToken = (role = "HSE_OFFICER") => {
  return jwt.sign(
    {
      id: "60d0fe4f5311236168a109ca",
      email: "hse.auditor@safety.org",
      role,
      name: "HSE Auditor",
    },
    env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

describe("Phase 7 - IOGP Life-Saving Rules API Integration Tests", () => {
  const token = generateTestToken();

  describe("GET /api/life-saving-rules", () => {
    it("should reject unauthenticated request with 401", async () => {
      const res = await request(app).get("/api/life-saving-rules");
      expect(res.status).toBe(401);
    });

    it("should return the list of 9 official IOGP rules with 200", async () => {
      const res = await request(app)
        .get("/api/life-saving-rules")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toHaveLength(9);
    });
  });

  describe("GET /api/life-saving-rules/:id", () => {
    it("should return details for valid rule code", async () => {
      const res = await request(app)
        .get("/api/life-saving-rules/ENERGY_ISOLATION")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("officialName", "Energy Isolation");
      expect(res.body.data).toHaveProperty("source");
    });

    it("should return 404 for non-existent rule identifier", async () => {
      const res = await request(app)
        .get("/api/life-saving-rules/NON_EXISTENT_RULE_CODE")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("RULE_NOT_FOUND");
    });
  });
});
