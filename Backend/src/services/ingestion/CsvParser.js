import { parse } from "csv-parse/sync";
import { AppError } from "../../utils/appError.js";
import { logger } from "../../utils/logger.js";

export class CsvParser {
  /**
   * Parse CSV buffer or string into normalized report records.
   */
  static parse(input, originalFileName = "data.csv") {
    const csvContent = Buffer.isBuffer(input) ? input.toString("utf-8") : input;

    if (!csvContent || typeof csvContent !== "string" || !csvContent.trim()) {
      throw new AppError("Empty CSV content provided", 400, "EMPTY_CSV_CONTENT");
    }

    try {
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      if (!records || records.length === 0) {
        throw new AppError("CSV file has no data rows", 400, "NO_DATA_ROWS");
      }

      logger.info(`CSV parsed successfully: ${originalFileName} (${records.length} records)`);

      // Normalize headers and return list of records
      return records.map((row) => {
        const normalizedRow = {};
        for (const [key, val] of Object.entries(row)) {
          const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
          normalizedRow[cleanKey] = val;
        }

        return {
          title: normalizedRow.title || normalizedRow.incidenttitle || normalizedRow.heading || "",
          site: normalizedRow.site || normalizedRow.plant || normalizedRow.locationname || "Main Site",
          facility: normalizedRow.facility || normalizedRow.unit || "General Facility",
          location: normalizedRow.location || normalizedRow.area || normalizedRow.workarea || "General Area",
          activity: normalizedRow.activity || normalizedRow.task || normalizedRow.operation || "General Maintenance",
          reportType: normalizedRow.type || normalizedRow.reporttype || normalizedRow.category || "INCIDENT",
          description: normalizedRow.description || normalizedRow.eventdescription || normalizedRow.narrative || normalizedRow.details || Object.values(row).join(" | "),
          eventDate: normalizedRow.date || normalizedRow.eventdate || normalizedRow.incidentdate || new Date().toISOString(),
          department: normalizedRow.department || normalizedRow.dept || "Operations",
          equipment: normalizedRow.equipment ? normalizedRow.equipment.split(/[,;]/).map((e) => e.trim()).filter(Boolean) : [],
          rawText: Object.entries(row).map(([k, v]) => `${k}: ${v}`).join("\n"),
        };
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Error parsing CSV ${originalFileName}:`, error);
      throw new AppError(`Failed to parse CSV file: ${error.message}`, 400, "CSV_PARSE_ERROR");
    }
  }
}

export default CsvParser;
