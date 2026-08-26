import { z } from "zod";
import { PRECURSOR_TAXONOMY } from "../constants/precursor.constants.js";

export const detectedPrecursorItemSchema = z.object({
  type: z.enum(PRECURSOR_TAXONOMY),
  confidence: z
    .number({ required_error: "Confidence is required" })
    .min(0, "Confidence cannot be less than 0.0")
    .max(1, "Confidence cannot be greater than 1.0"),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).default("HIGH"),
  evidenceText: z.string({ required_error: "Evidence text quote is required" }),
  failedBarriers: z.array(z.string()).default([]),
  detectionReason: z.string().default(""),
});

export const barrierSignalItemSchema = z.object({
  barrierName: z.string(),
  hierarchyLevel: z
    .enum(["ELIMINATION", "SUBSTITUTION", "ENGINEERING", "ADMINISTRATIVE", "PPE", "PROCEDURAL", "HUMAN"])
    .default("ENGINEERING"),
  status: z
    .enum(["PRESENT_EFFECTIVE", "DEGRADED", "FAILED", "MISSING"])
    .default("PRESENT_EFFECTIVE"),
  failureMode: z.string().default(""),
  evidenceText: z.string().default(""),
});

export const precursorDetectionOutputSchema = z.object({
  detectedPrecursors: z.array(detectedPrecursorItemSchema).default([]),
  barrierSignals: z.array(barrierSignalItemSchema).default([]),
  primaryPrecursor: z.string().optional().default(""),
});

export default {
  detectedPrecursorItemSchema,
  barrierSignalItemSchema,
  precursorDetectionOutputSchema,
};
