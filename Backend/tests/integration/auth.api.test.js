import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { User } from "../../src/models/User.js";
import { AuthService } from "../../src/services/auth/AuthService.js";

describe("Phase 2 - Auth API Integration Tests", () => {
  describe("POST /api/auth/register", () => {
    it("should reject registration with missing required fields", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        // missing email and password
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body.error).toHaveProperty("code", "VALIDATION_ERROR");
      expect(res.body.error.details).toBeDefined();
    });

    it("should reject registration with invalid email", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "not-an-email",
        password: "securePassword123",
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should reject login with empty body", async () => {
      const res = await request(app).post("/api/auth/login").send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject login with missing password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "admin@safety.org",
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/auth/me", () => {
    it("should reject request without Authorization header with 401", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("should reject request with malformed Bearer token with 401", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-jwt-token-string");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_TOKEN");
    });
  });
});
