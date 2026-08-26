import { z } from "zod";

export const barrierModificationSchema = z.object({
  barrierName: z.string({ required_error: "Barrier name is required" }),
  category: z.enum(["ELIMINATION", "SUBSTITUTION", "ENGINEERING", "ADMINISTRATIVE", "PPE", "PROCEDURAL", "HUMAN"]).default("ENGINEERING"),
  simulatedStatus: z.enum(["PRESENT_EFFECTIVE", "DEGRADED", "FAILED", "MISSING"]),
});

export const precursorModificationSchema = z.object({
  precursorType: z.string({ required_error: "Precursor type is required" }),
  action: z.enum(["ADD", "REMOVE"]).default("ADD"),
});

export const energyModificationSchema = z.object({
  energyType: z.string({ required_error: "Energy type is required" }),
  action: z.enum(["CONTROL", "UNCONTROL", "REMOVE"]).default("CONTROL"),
});

export const runSimulationSchema = z.object({
  scenarioName: z.string({ required_error: "Scenario name is required" }).min(3, "Scenario name must be at least 3 characters"),
  baseReportId: z.string().optional(),
  customScenarioText: z.string().optional(),
  barrierModifications: z.array(barrierModificationSchema).default([]),
  precursorModifications: z.array(precursorModificationSchema).default([]),
  energyModifications: z.array(energyModificationSchema).default([]),
});

export const compareSimulationsSchema = z.object({
  simulationIds: z.array(z.string()).min(2, "At least 2 simulation IDs are required for comparison"),
});

export default {
  barrierModificationSchema,
  precursorModificationSchema,
  energyModificationSchema,
  runSimulationSchema,
  compareSimulationsSchema,
};
