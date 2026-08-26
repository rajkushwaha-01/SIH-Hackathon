import { z } from "zod";
import { SIF_CLASSIFICATIONS } from "../constants/sif.constants.js";

export const sifClassificationSchema = z.object({
  classification: z.enum(SIF_CLASSIFICATIONS),
  modelConfidence: z
    .number({ required_error: "Model confidence is required" })
    .min(0, "Confidence cannot be less than 0.0")
    .max(1, "Confidence cannot be greater than 1.0"),
  classificationReason: z
    .string({ required_error: "Classification reason is required" })
    .min(10, "Reason must be at least 10 characters"),
  isHighPotentialEvent: z.boolean().default(false),
  decisionFactors: z
    .array(
      z.object({
        factor: z.string(),
        presence: z.boolean(),
        evidence: z.string().default(""),
      })
    )
    .default([]),
  actualVsPotentialDistinction: z
    .object({
      actualOutcome: z.string().default(""),
      potentialOutcome: z.string().default(""),
      divergenceReason: z.string().default(""),
    })
    .default({
      actualOutcome: "",
      potentialOutcome: "",
      divergenceReason: "",
    }),
  supportingEvidence: z
    .array(
      z.object({
        text: z.string(),
        justification: z.string().default(""),
      })
    )
    .default([]),
});

export default {
  sifClassificationSchema,
};
