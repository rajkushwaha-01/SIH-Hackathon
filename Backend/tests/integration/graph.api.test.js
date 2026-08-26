import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import { env } from "../../src/config/env.js";

const generateTestToken = (role = "HSE_OFFICER") => {
  return jwt.sign(
    {
      id: "60d0fe4f5311236168a109ca",
      email: "graph.analyst@safety.org",
      role,
      name: "Graph Analyst",
    },
    env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

describe("Phase 12 - SIF Precursor Causal Graph API Integration Tests", () => {
  const token = generateTestToken();

  describe("GET /api/graph", () => {
    it("should reject unauthenticated request with 401", async () => {
      const res = await request(app).get("/api/graph");
      expect(res.status).toBe(401);
    });

    it("should return full enterprise causal graph with 200", async () => {
      const res = await request(app)
        .get("/api/graph")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toHaveProperty("nodes");
      expect(res.body.data).toHaveProperty("edges");
      expect(res.body.data).toHaveProperty("highRiskPathways");
      expect(res.body.data).toHaveProperty("cytoscapeElements");
    });
  });

  describe("GET /api/graph/pathways", () => {
    it("should return high-risk causal pathways with 200", async () => {
      const res = await request(app)
        .get("/api/graph/pathways")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toHaveProperty("pathways");
      expect(Array.isArray(res.body.data.pathways)).toBe(true);
    });
  });

  describe("GET /api/graph/precursor/:type", () => {
    it("should return causal subgraph for precursor with 200", async () => {
      const res = await request(app)
        .get("/api/graph/precursor/WORKING_AT_HEIGHT")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toHaveProperty("nodes");
      expect(res.body.data).toHaveProperty("edges");
    });
  });
});
