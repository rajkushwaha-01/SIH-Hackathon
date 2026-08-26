import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import { env } from "../../src/config/env.js";

const generateTestToken = (role = "HSE_OFFICER") => {
  return jwt.sign(
    {
      id: "60d0fe4f5311236168a109ca",
      email: "simulation.engineer@safety.org",
      role,
      name: "Simulation Engineer",
    },
    env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

describe("Phase 13 - What-If Risk Simulator API Integration Tests", () => {
  const token = generateTestToken();

  describe("POST /api/simulator/simulate", () => {
    it("should reject unauthenticated request with 401", async () => {
      const res = await request(app)
        .post("/api/simulator/simulate")
        .send({ scenarioName: "Test Scenario" });

      expect(res.status).toBe(401);
    });

    it("should reject request with invalid/short scenario name with 400", async () => {
      const res = await request(app)
        .post("/api/simulator/simulate")
        .set("Authorization", `Bearer ${token}`)
        .send({ scenarioName: "a" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should execute simulation and return baseline, simulated, and delta metrics with 200", async () => {
      const res = await request(app)
        .post("/api/simulator/simulate")
        .set("Authorization", `Bearer ${token}`)
        .send({
          scenarioName: "Simulation: Restore LOTO and Voltage Verification",
          barrierModifications: [
            {
              barrierName: "Lockout / Tagout (LOTO)",
              category: "ENGINEERING",
              simulatedStatus: "PRESENT_EFFECTIVE",
            },
          ],
          energyModifications: [
            {
              energyType: "ELECTRICAL",
              action: "CONTROL",
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toHaveProperty("baseline");
      expect(res.body.data).toHaveProperty("simulated");
      expect(res.body.data).toHaveProperty("delta");
      expect(res.body.data.delta.scoreDifference).toBeLessThan(0);
    });
  });

  describe("GET /api/simulator", () => {
    it("should return list of past simulations with 200", async () => {
      const res = await request(app)
        .get("/api/simulator")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
