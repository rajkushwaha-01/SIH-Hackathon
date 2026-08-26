import { describe, it, expect } from "vitest";
import { TextParser } from "../../src/services/ingestion/TextParser.js";
import { CsvParser } from "../../src/services/ingestion/CsvParser.js";
import { PdfParser } from "../../src/services/ingestion/PdfParser.js";

describe("Phase 3 - Multi-Format Parsers Unit Tests", () => {
  describe("TextParser", () => {
    it("should parse key-value structured headers from plain text", () => {
      const text = `
Site: Offshore Platform Alpha
Facility: Gas Compression Module
Location: Deck Level 3
Activity: Valve Replacement
Type: Near Miss
Equipment: Flange V-102, Wrench

Technician unbolted flange without verifying zero energy state on valve V-102.
      `;

      const result = TextParser.parse(text);

      expect(result.site).toBe("Offshore Platform Alpha");
      expect(result.facility).toBe("Gas Compression Module");
      expect(result.location).toBe("Deck Level 3");
      expect(result.activity).toBe("Valve Replacement");
      expect(result.reportType).toBe("NEAR_MISS");
      expect(result.equipment).toContain("Flange V-102");
      expect(result.description).toContain("Technician unbolted flange");
    });

    it("should handle unstructured raw narrative text gracefully", () => {
      const text = "Worker slipped on oil spill in workshop. No injury occurred.";
      const result = TextParser.parse(text);

      expect(result.description).toBe(text);
      expect(result.title).toContain("Worker slipped");
    });

    it("should throw AppError for empty text", () => {
      expect(() => TextParser.parse("")).toThrow();
      expect(() => TextParser.parse("   ")).toThrow();
    });
  });

  describe("CsvParser", () => {
    it("should parse CSV content into structured report rows", () => {
      const csvData = `title,site,facility,location,activity,type,description
"Fall Hazard","Site Beta","Rig 2","Mast","Derrick Work","Near Miss","Worker disconnected lanyard"
"Electrical Spark","Site Gamma","Substation","MCC 1","Wiring","Incident","Short circuit occurred"`;

      const records = CsvParser.parse(csvData, "test.csv");

      expect(records).toHaveLength(2);
      expect(records[0].title).toBe("Fall Hazard");
      expect(records[0].site).toBe("Site Beta");
      expect(records[0].reportType).toBe("Near Miss");
      expect(records[1].title).toBe("Electrical Spark");
      expect(records[1].site).toBe("Site Gamma");
    });

    it("should throw AppError for empty CSV", () => {
      expect(() => CsvParser.parse("", "empty.csv")).toThrow();
    });
  });

  describe("PdfParser", () => {
    it("should reject invalid/empty PDF buffers with AppError", async () => {
      await expect(PdfParser.parse(null)).rejects.toThrow();
      await expect(PdfParser.parse(Buffer.from(""))).rejects.toThrow();
    });
  });
});
