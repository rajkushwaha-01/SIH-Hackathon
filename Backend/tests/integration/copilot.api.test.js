import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import { env } from "../../src/config/env.js";

const generateTestToken = (role = "HSE_OFFICER") => {
  return jwt.sign(
    {
      id: "60d0fe4f5311236168a109ca",
      email: "copilot.user@safety.org",
      role,
      name: "Copilot Safety Officer",
    },
    env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

describe("Phase 14 - Evidence-Grounded HSE Copilot API Integration Tests", () => {
  const token = generateTestToken();

  describe("POST /api/copilot/chat", () => {
    it("should reject unauthenticated request with 401", async () => {
      const res = await request(app)
        .post("/api/copilot/chat")
        .send({ query: "What safety barriers failed?" });

      expect(res.status).toBe(401);
    });

    it("should reject empty query with 400", async () => {
      const res = await request(app)
        .post("/api/copilot/chat")
        .set("Authorization", `Bearer ${token}`)
        .send({ query: "" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_QUERY");
    });

    it("should return grounded response with citations and suggested follow-ups with 200", async () => {
      const res = await request(app)
        .post("/api/copilot/chat")
        .set("Authorization", `Bearer ${token}`)
        .send({
          query: "What are the common causes of scaffolding incidents and what IOGP rules apply?",
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toHaveProperty("sessionId");
      expect(res.body.data).toHaveProperty("assistantMessage");
      expect(res.body.data.assistantMessage).toHaveProperty("content");
      expect(res.body.data).toHaveProperty("citations");
      expect(res.body.data).toHaveProperty("suggestedFollowUps");
      expect(res.body.data.suggestedFollowUps.length).toBeGreaterThan(0);
    });
  });

  describe("POST /api/copilot/sessions & GET /api/copilot/sessions", () => {
    it("should create new session and list user sessions with 200/201", async () => {
      const createRes = await request(app)
        .post("/api/copilot/sessions")
        .set("Authorization", `Bearer ${token}`)
        .send({
          initialQuery: "Investigation into high pressure flange leak",
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data).toHaveProperty("sessionId");

      const listRes = await request(app)
        .get("/api/copilot/sessions")
        .set("Authorization", `Bearer ${token}`);

      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body.data)).toBe(true);
    });
  });
});
