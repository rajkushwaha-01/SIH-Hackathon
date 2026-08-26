import { z } from "zod";

export const reviewSubmissionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT", "OVERRIDE"], {
    required_error: "Review decision is required (APPROVE, REJECT, or OVERRIDE)",
  }),
  overrideSifClassification: z.enum(["SIF_POTENTIAL", "NON_SIF", "INCONCLUSIVE"]).optional(),
  overrideRiskScore: z.number().min(0).max(100).optional(),
  overridePrecursors: z.array(
    z.object({
      type: z.string(),
      action: z.enum(["ADD", "REMOVE"]).default("ADD"),
    })
  ).optional(),
  overrideBarriers: z.array(
    z.object({
      name: z.string(),
      category: z.string().default("ENGINEERING"),
      status: z.enum(["PRESENT_EFFECTIVE", "DEGRADED", "FAILED", "MISSING"]),
    })
  ).optional(),
  justification: z
    .string({ required_error: "Mandatory justification is required for human HSE review decisions" })
    .min(10, "Justification must be at least 10 characters explaining the HSE rationale"),
});

export default {
  reviewSubmissionSchema,
};
