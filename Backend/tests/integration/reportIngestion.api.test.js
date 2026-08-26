import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import { env } from "../../src/config/env.js";

const generateTestToken = (role = "HSE_OFFICER") => {
  return jwt.sign(
    {
      id: "60d0fe4f5311236168a109ca",
      email: "hse.tester@safety.org",
      role,
      name: "HSE Tester",
    },
    env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

describe("Phase 3 - Report Ingestion API Integration Tests", () => {
  const token = generateTestToken();

  describe("Authentication Gate", () => {
    it("should reject unauthenticated POST /api/reports with 401", async () => {
      const res = await request(app).post("/api/reports").send({
        rawText: "Unsafe act observed at construction site.",
      });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("should reject unauthenticated GET /api/reports with 401", async () => {
      const res = await request(app).get("/api/reports");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("POST /api/reports Validation", () => {
    it("should reject report creation with empty body", async () => {
      const res = await request(app)
        .post("/api/reports")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject report creation with very short description (<5 chars)", async () => {
      const res = await request(app)
        .post("/api/reports")
        .set("Authorization", `Bearer ${token}`)
        .send({
          rawText: "abc",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /api/reports/upload Validation", () => {
    it("should reject unsupported file extensions (e.g. .exe)", async () => {
      const res = await request(app)
        .post("/api/reports/upload")
        .set("Authorization", `Bearer ${token}`)
        .attach("file", Buffer.from("fake executable binary content"), "malicious.exe");

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_FILE_TYPE");
    });
  });
});
