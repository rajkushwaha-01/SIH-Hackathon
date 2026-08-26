import { z } from "zod";

export const nlpExtractionSchema = z.object({
  activity: z.string().default("General Work Activity"),
  location: z.string().default("General Work Area"),
  hazards: z
    .array(
      z.object({
        name: z.string(),
        category: z.string().default("PROCESS_SAFETY"),
        description: z.string().default(""),
      })
    )
    .default([]),
  energySources: z
    .array(
      z.object({
        type: z.string(),
        magnitude: z.string().default("HIGH"),
        controlled: z.boolean().default(false),
      })
    )
    .default([]),
  equipment: z.array(z.string()).default([]),
  peopleInvolved: z.array(z.string()).default([]),
  unsafeActs: z.array(z.string()).default([]),
  unsafeConditions: z.array(z.string()).default([]),
  barriers: z
    .array(
      z.object({
        name: z.string(),
        category: z
          .enum(["ELIMINATION", "SUBSTITUTION", "ENGINEERING", "ADMINISTRATIVE", "PPE", "PROCEDURAL", "HUMAN"])
          .default("ENGINEERING"),
        status: z
          .enum(["PRESENT_EFFECTIVE", "DEGRADED", "FAILED", "MISSING"])
          .default("PRESENT_EFFECTIVE"),
        evidenceText: z.string().default(""),
      })
    )
    .default([]),
  consequences: z
    .object({
      potentialInjuries: z.array(z.string()).default([]),
      potentialFatalities: z.boolean().default(false),
      worstCaseConsequence: z.string().default(""),
    })
    .default({
      potentialInjuries: [],
      potentialFatalities: false,
      worstCaseConsequence: "",
    }),
  actualOutcome: z.string().default(""),
  potentialOutcome: z.string().default(""),
  evidenceSnippets: z
    .array(
      z.object({
        text: z.string(),
        section: z.string().default("Event Description"),
        supports: z.string().default("Extraction"),
      })
    )
    .default([]),
});

export default {
  nlpExtractionSchema,
};
