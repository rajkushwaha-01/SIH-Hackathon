import { describe, it, expect } from "vitest";
import { generateContentHash, normalizeTextForHashing, generateReportId } from "../../src/utils/hash.js";

describe("Phase 3 - Duplicate Detection & Hashing Unit Tests", () => {
  it("should generate identical hash for identical texts with different casing and whitespace", () => {
    const text1 = "Worker entered the high voltage room without proper PPE.";
    const text2 = "  WORKER   entered  the   high  voltage  room without proper PPE.   \n";

    const hash1 = generateContentHash(text1);
    const hash2 = generateContentHash(text2);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex string length
  });

  it("should generate different hashes for distinct content", () => {
    const text1 = "Worker entered the high voltage room without proper PPE.";
    const text2 = "Scaffolder working at height without safety harness tie-off.";

    const hash1 = generateContentHash(text1);
    const hash2 = generateContentHash(text2);

    expect(hash1).not.toBe(hash2);
  });

  it("should generate valid human-readable report IDs", () => {
    const id1 = generateReportId("INC");
    const id2 = generateReportId("INC");

    expect(id1).toMatch(/^INC-\d{4}-\d{4}$/);
    expect(id2).toMatch(/^INC-\d{4}-\d{4}$/);
  });
});
