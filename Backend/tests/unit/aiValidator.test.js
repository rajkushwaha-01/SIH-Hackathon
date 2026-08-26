import { describe, it, expect } from "vitest";
import { nlpExtractionSchema } from "../../src/validators/aiOutput.validator.js";

describe("Phase 4 - AI Output Zod Validator Unit Tests", () => {
  it("should validate a complete and correct NLP extraction payload", () => {
    const samplePayload = {
      activity: "Scaffolding Maintenance",
      location: "Offshore Platform Deck 3",
      hazards: [
        {
          name: "Working at Height",
          category: "PHYSICAL",
          description: "Fall hazard above 6 meters",
        },
      ],
      energySources: [
        {
          type: "GRAVITY",
          magnitude: "HIGH",
          controlled: false,
        },
      ],
      equipment: ["Scaffold Tube", "Wrench"],
      peopleInvolved: ["Scaffolder"],
      unsafeActs: ["Unhooked safety harness while transitioning between planks"],
      unsafeConditions: ["Missing intermediate guardrail"],
      barriers: [
        {
          name: "100% Fall Protection Tie-Off",
          category: "PPE",
          status: "FAILED",
          evidenceText: "Worker unhooked lanyard without second anchor point.",
        },
      ],
      consequences: {
        potentialInjuries: ["Multiple fractures", "Internal trauma"],
        potentialFatalities: true,
        worstCaseConsequence: "Fatal fall from height",
      },
      actualOutcome: "Worker slipped, caught ledger pipe, zero injury sustained.",
      potentialOutcome: "6 meter fall to steel deck resulting in fatality.",
      evidenceSnippets: [
        {
          text: "Worker unhooked lanyard without second anchor point.",
          section: "Event Description",
          supports: "Barrier Failure",
        },
      ],
    };

    const result = nlpExtractionSchema.safeParse(samplePayload);
    expect(result.success).toBe(true);
    expect(result.data.hazards).toHaveLength(1);
    expect(result.data.barriers[0].status).toBe("FAILED");
    expect(result.data.consequences.potentialFatalities).toBe(true);
  });

  it("should apply sensible defaults when optional fields are omitted", () => {
    const minimalPayload = {
      activity: "General Inspection",
    };

    const result = nlpExtractionSchema.safeParse(minimalPayload);
    expect(result.success).toBe(true);
    expect(result.data.hazards).toEqual([]);
    expect(result.data.barriers).toEqual([]);
    expect(result.data.consequences.potentialFatalities).toBe(false);
  });

  it("should reject invalid barrier status values", () => {
    const invalidPayload = {
      barriers: [
        {
          name: "LOTO",
          category: "ENGINEERING",
          status: "INVALID_STATUS_VALUE",
        },
      ],
    };

    const result = nlpExtractionSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });
});
