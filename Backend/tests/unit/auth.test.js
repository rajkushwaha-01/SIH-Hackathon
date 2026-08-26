import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { registerSchema, loginSchema } from "../../src/validators/auth.validator.js";
import { AuthService } from "../../src/services/auth/AuthService.js";
import { authorize } from "../../src/middleware/role.middleware.js";
import { authenticate } from "../../src/middleware/auth.middleware.js";
import { env } from "../../src/config/env.js";
import { User } from "../../src/models/User.js";

describe("Phase 2 - Authentication & Authorization Unit Tests", () => {
  describe("Zod Auth Validators", () => {
    it("should validate a valid registration payload", () => {
      const validPayload = {
        name: "John HSE Officer",
        email: "john.hse@company.com",
        password: "securePassword123",
        role: "HSE_OFFICER",
        site: "Site Alpha",
        department: "Safety & Environment",
      };

      const result = registerSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      expect(result.data.email).toBe("john.hse@company.com");
    });

    it("should reject registration payload with short password (<6 chars)", () => {
      const invalidPayload = {
        name: "John",
        email: "john@company.com",
        password: "123",
      };

      const result = registerSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("Password must be at least 6 characters");
    });

    it("should reject registration with invalid email format", () => {
      const invalidPayload = {
        name: "John Doe",
        email: "invalid-email-string",
        password: "password123",
      };

      const result = registerSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("valid email");
    });

    it("should validate a valid login payload", () => {
      const validLogin = {
        email: "user@example.com",
        password: "mypassword123",
      };

      const result = loginSchema.safeParse(validLogin);
      expect(result.success).toBe(true);
    });

    it("should reject login payload missing password", () => {
      const invalidLogin = {
        email: "user@example.com",
      };

      const result = loginSchema.safeParse(invalidLogin);
      expect(result.success).toBe(false);
    });
  });

  describe("JWT Token Generation & Verification", () => {
    it("should generate a valid JWT token containing user identity", () => {
      const mockUser = {
        _id: "60d0fe4f5311236168a109ca",
        name: "Alice Safety",
        email: "alice@safety.org",
        role: "ADMIN",
      };

      const token = AuthService.generateToken(mockUser);
      expect(typeof token).toBe("string");

      const decoded = jwt.verify(token, env.JWT_SECRET);
      expect(decoded.id).toBe("60d0fe4f5311236168a109ca");
      expect(decoded.email).toBe("alice@safety.org");
      expect(decoded.role).toBe("ADMIN");
      expect(decoded.name).toBe("Alice Safety");
    });
  });

  describe("Role Authorization Middleware", () => {
    it("should allow access when user has the required role", () => {
      const req = {
        user: {
          _id: "123",
          role: "ADMIN",
        },
      };
      const res = {};
      const next = vi.fn();

      const middleware = authorize("ADMIN", "HSE_OFFICER");
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it("should deny access with 403 when user lacks the required role", () => {
      const req = {
        user: {
          _id: "123",
          role: "VIEWER",
        },
      };
      const res = {};
      const next = vi.fn();

      const middleware = authorize("ADMIN", "HSE_OFFICER");
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeDefined();
      expect(err.statusCode).toBe(403);
      expect(err.errorCode).toBe("FORBIDDEN");
    });

    it("should deny access with 401 when request is unauthenticated", () => {
      const req = {};
      const res = {};
      const next = vi.fn();

      const middleware = authorize("ADMIN");
      middleware(req, res, next);

      const err = next.mock.calls[0][0];
      expect(err).toBeDefined();
      expect(err.statusCode).toBe(401);
      expect(err.errorCode).toBe("UNAUTHORIZED");
    });
  });

  describe("Authentication Middleware", () => {
    it("should reject requests without Authorization header with 401", async () => {
      const req = { headers: {} };
      const res = {};
      const next = vi.fn();

      await authenticate(req, res, next);

      const err = next.mock.calls[0][0];
      expect(err).toBeDefined();
      expect(err.statusCode).toBe(401);
      expect(err.errorCode).toBe("UNAUTHORIZED");
    });

    it("should reject requests with invalid token with 401", async () => {
      const req = {
        headers: {
          authorization: "Bearer invalid.token.string",
        },
      };
      const res = {};
      const next = vi.fn();

      await authenticate(req, res, next);

      const err = next.mock.calls[0][0];
      expect(err).toBeDefined();
      expect(err.statusCode).toBe(401);
      expect(err.errorCode).toBe("INVALID_TOKEN");
    });
  });
});
