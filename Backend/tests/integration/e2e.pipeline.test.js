import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import { env } from "../../src/config/env.js";

const generateAdminToken = () => {
  return jwt.sign(
    {
      id: "60d0fe4f5311236168a109ca",
      email: "lead.admin@safety.org",
      role: "ADMIN",
      name: "Master HSE Administrator",
    },
    env.JWT_SECRET,
    { expiresIn: "2h" }
  );
};

describe("Phase 18 - Complete End-to-End Backend MVP Integration Pipeline", () => {
  const token = generateAdminToken();

  it("Step 1: Health Check Endpoint should be operational", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(["HEALTHY", "DEGRADED"]).toContain(res.body.data.status);
    expect(res.body.data).toHaveProperty("service", "sih-sif-precursor-engine-backend");
  });

  it("Step 2: User Ingestion should accept a new safety incident report", async () => {
    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token}`)
      .send({
        rawText: "Technician was working at 9m height on temporary pipe scaffold without hooking harness lanyard. Heavy wrench slipped and fell 9m to deck.",
        site: "Offshore Platform Alpha",
        activity: "Scaffold Pipe Fitting",
        eventDate: new Date().toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("reportId");
    expect(res.body.data).toHaveProperty("status", "INGESTED");
  });

  it("Step 3: SIF Taxonomy and IOGP Rules should be accessible", async () => {
    const precRes = await request(app)
      .get("/api/precursors")
      .set("Authorization", `Bearer ${token}`);

    expect(precRes.status).toBe(200);
    expect(precRes.body.data.count).toBe(14); // 14-category taxonomy
    expect(precRes.body.data.list.length).toBe(14);

    const lsrRes = await request(app)
      .get("/api/life-saving-rules")
      .set("Authorization", `Bearer ${token}`);

    expect(lsrRes.status).toBe(200);
    expect(lsrRes.body.data.length).toBe(9); // 9 official IOGP rules
  });

  it("Step 4: Semantic Search should retrieve vector search results", async () => {
    const res = await request(app)
      .post("/api/search/semantic")
      .set("Authorization", `Bearer ${token}`)
      .send({
        query: "Working at height fall hazard and dropped objects",
        topK: 3,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.data).toHaveProperty("results");
    expect(Array.isArray(res.body.data.results)).toBe(true);
  });

  it("Step 5: Recurring Pattern Detection should mine multidimensional clusters", async () => {
    const res = await request(app)
      .post("/api/patterns/detect")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("patterns");
    expect(res.body.data.patterns.length).toBeGreaterThan(0);
  });

  it("Step 6: SIF Precursor Causal Graph (WOW #1) should export Cytoscape payload & pathways", async () => {
    const res = await request(app)
      .get("/api/graph")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("nodes");
    expect(res.body.data).toHaveProperty("edges");
    expect(res.body.data).toHaveProperty("highRiskPathways");
    expect(res.body.data).toHaveProperty("cytoscapeElements");
  });

  it("Step 7: What-If Risk Simulator (WOW #2) should calculate barrier restoration delta", async () => {
    const res = await request(app)
      .post("/api/simulator/simulate")
      .set("Authorization", `Bearer ${token}`)
      .send({
        scenarioName: "Restore 100% Fall Arrest Harness",
        barrierModifications: [
          {
            barrierName: "100% Fall Arrest Harness",
            category: "PPE",
            simulatedStatus: "PRESENT_EFFECTIVE",
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("delta");
    expect(res.body.data.delta.scoreDifference).toBeLessThanOrEqual(0);
  });

  it("Step 8: Evidence-Grounded HSE Copilot (WOW #3) should answer with citations", async () => {
    const res = await request(app)
      .post("/api/copilot/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({
        query: "What critical barriers failed during working at height incidents?",
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("assistantMessage");
    expect(res.body.data).toHaveProperty("citations");
    expect(res.body.data.citations.length).toBeGreaterThan(0);
    expect(res.body.data).toHaveProperty("suggestedFollowUps");
  });

  it("Step 9: Executive Dashboard should aggregate enterprise KPIs and breakdowns", async () => {
    const res = await request(app)
      .get("/api/analytics/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("kpis");
    expect(res.body.data).toHaveProperty("bySite");
    expect(res.body.data).toHaveProperty("byPrecursor");
    expect(res.body.data).toHaveProperty("barrierHealth");
  });

  it("Step 10: Smart HSE Alerts should provide active risk prioritization list", async () => {
    const res = await request(app)
      .get("/api/alerts")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("Step 11: Human-in-the-Loop Review should apply review override", async () => {
    const res = await request(app)
      .post("/api/reports/INC-2026-001/review")
      .set("Authorization", `Bearer ${token}`)
      .send({
        decision: "APPROVE",
        justification: "Verified all physical barrier findings against site permit-to-work records.",
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("reviewStatus", "APPROVED");
  });

  it("Step 12: Unified 360 Report Detail should return report, analysis, and audit log", async () => {
    const res = await request(app)
      .get("/api/reports/INC-2026-001/detail")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("report");
    expect(res.body.data).toHaveProperty("latestAnalysis");
    expect(res.body.data).toHaveProperty("auditTrail");
  });
});
