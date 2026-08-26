import { describe, it, expect } from "vitest";
import { GeminiService } from "../../src/services/ai/GeminiService.js";
import { nlpExtractionSchema } from "../../src/validators/aiOutput.validator.js";

describe("Phase 4 - GeminiService Unit Tests", () => {
  describe("cleanAndParseJson", () => {
    it("should parse standard JSON string", () => {
      const jsonStr = '{"activity": "Welding", "location": "Workshop"}';
      const parsed = GeminiService.cleanAndParseJson(jsonStr);
      expect(parsed).toEqual({ activity: "Welding", location: "Workshop" });
    });

    it("should strip markdown ```json code blocks cleanly", () => {
      const markdownJson = `\`\`\`json
{
  "activity": "Confined Space Entry",
  "location": "Storage Tank 4"
}
\`\`\``;
      const parsed = GeminiService.cleanAndParseJson(markdownJson);
      expect(parsed.activity).toBe("Confined Space Entry");
      expect(parsed.location).toBe("Storage Tank 4");
    });

    it("should throw AppError for invalid JSON", () => {
      expect(() => GeminiService.cleanAndParseJson("not a valid json")).toThrow();
    });
  });

  describe("generateMockExtraction", () => {
    it("should detect height hazard from working at height narrative", () => {
      const mockReport = {
        reportId: "INC-2026-TEST",
        originalContent: "Scaffolder was working at height without safety harness tie-off.",
        normalizedReport: {
          activity: "Scaffolding",
          location: "Deck 3",
          description: "Scaffolder was working at height without safety harness tie-off.",
        },
      };

      const result = GeminiService.generateMockExtraction(mockReport);
      const validated = nlpExtractionSchema.parse(result);

      expect(validated.hazards.some((h) => h.name.includes("Height"))).toBe(true);
      expect(validated.energySources.some((e) => e.type === "GRAVITY")).toBe(true);
      expect(validated.consequences.potentialFatalities).toBe(true);
    });

    it("should detect electrical energy hazard from electrical narrative", () => {
      const mockReport = {
        reportId: "INC-2026-ELEC",
        originalContent: "Electrician worked on live voltage circuit without LOTO verification.",
        normalizedReport: {
          activity: "Electrical Maintenance",
          location: "Substation",
          description: "Electrician worked on live voltage circuit without LOTO verification.",
        },
      };

      const result = GeminiService.generateMockExtraction(mockReport);
      const validated = nlpExtractionSchema.parse(result);

      expect(validated.hazards.some((h) => h.name.includes("Electrical"))).toBe(true);
      expect(validated.energySources.some((e) => e.type === "ELECTRICAL")).toBe(true);
    });
  });
});
