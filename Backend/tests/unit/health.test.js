import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.js";

describe("Phase 1 - Health & Infrastructure Verification", () => {
  it("should return health status payload from /api/health", async () => {
    const res = await request(app).get("/api/health");
    
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("status");
    expect(res.body.data).toHaveProperty("service", "sih-sif-precursor-engine-backend");
    expect(res.body.data).toHaveProperty("version", "1.0.0");
    expect(res.body.data.components).toHaveProperty("server", "ONLINE");
    expect(res.body.data.components).toHaveProperty("database");
    expect(res.body.data.components).toHaveProperty("aiModel");
    expect(res.body.data.components).toHaveProperty("vectorDb");
    expect(res.body.data.system).toHaveProperty("nodeVersion");
  });

  it("should return health status payload from /health", async () => {
    const res = await request(app).get("/health");
    
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.data).toHaveProperty("service", "sih-sif-precursor-engine-backend");
  });

  it("should return standardized 404 error envelope for unknown routes", async () => {
    const res = await request(app).get("/api/unknown-endpoint-xyz");
    
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toHaveProperty("code", "ROUTE_NOT_FOUND");
    expect(res.body.error.message).toContain("not found");
  });
});
