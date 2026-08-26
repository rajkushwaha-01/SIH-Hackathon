import { describe, it, expect } from "vitest";
import { HseCopilotService } from "../../src/services/copilot/HseCopilotService.js";

describe("Phase 14 - Evidence-Grounded HSE Copilot Unit Tests", () => {
  it("should extract bracket citations for Report IDs and IOGP Life-Saving Rules", () => {
    const text = `Based on [Report ID: INC-2026-001] and [IOGP Rule: Energy Isolation], the primary barrier failure was missing LOTO.`;
    const mockRagContext = {
      incidents: [{ reportId: "INC-2026-001", title: "Electrical Switchboard Incident", evidenceSnippet: "440V panel access" }],
      applicableRules: [{ ruleId: "IOGP-LSR-04", name: "Energy Isolation", description: "Verify zero energy" }],
    };

    const citations = HseCopilotService.extractCitations(text, mockRagContext);

    expect(citations.length).toBe(2);
    expect(citations[0].identifier).toBe("INC-2026-001");
    expect(citations[0].type).toBe("REPORT");
    expect(citations[1].identifier).toBe("IOGP-LSR-04");
    expect(citations[1].type).toBe("IOGP_RULE");
  });

  it("should generate deterministic grounded answer with citations and recommendations", () => {
    const query = "What are the key risks when opening 440V switchboards?";
    const mockRagContext = {
      incidents: [
        {
          reportId: "INC-ELEC-440",
          title: "440V Switchboard Near Miss",
          site: "Refinery Unit 2",
          activity: "Electrical Maintenance",
          evidenceSnippet: "Worker opened 440V panel without zero energy verification",
          sifClassification: "SIF_POTENTIAL",
          riskScore: 88,
        },
      ],
      applicableRules: [
        {
          ruleId: "IOGP-LSR-04",
          name: "Energy Isolation",
          description: "Verify isolation and zero energy before work begins.",
        },
      ],
    };

    const answer = HseCopilotService.generateDeterministicAnswer(query, mockRagContext);

    expect(answer).toContain("Executive HSE Assessment");
    expect(answer).toContain("[Report ID: INC-ELEC-440]");
    expect(answer).toContain("[IOGP Rule: Energy Isolation]");
    expect(answer).toContain("Recommended Hierarchy Interventions");
  });

  it("should reject empty chat queries with 400 AppError", async () => {
    await expect(HseCopilotService.chat({ query: "" })).rejects.toThrow();
  });
});
