import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import { env } from "../../src/config/env.js";

const generateTestToken = (role = "HSE_OFFICER") => {
  return jwt.sign(
    {
      id: "60d0fe4f5311236168a109ca",
      email: "hse.officer@safety.org",
      role,
      name: "HSE Officer",
    },
    env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

describe("Phase 6 - Precursor API Integration Tests", () => {
  const token = generateTestToken();

  describe("GET /api/precursors", () => {
    it("should reject unauthenticated request with 401", async () => {
      const res = await request(app).get("/api/precursors");
      expect(res.status).toBe(401);
    });

    it("should return the full 14-category taxonomy with 200", async () => {
      const res = await request(app)
        .get("/api/precursors")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toHaveProperty("count", 14);
      expect(res.body.data.list).toHaveLength(14);
    });
  });

  describe("GET /api/precursors/:type", () => {
    it("should return definition for valid precursor type", async () => {
      const res = await request(app)
        .get("/api/precursors/WORKING_AT_HEIGHT")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("name", "Working at Height");
      expect(res.body.data).toHaveProperty("defaultSeverity", "CRITICAL");
    });

    it("should return 404 for invalid precursor type", async () => {
      const res = await request(app)
        .get("/api/precursors/UNKNOWN_PRECURSOR_XYZ")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("PRECURSOR_TYPE_NOT_FOUND");
    });
  });
});
