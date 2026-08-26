import { AppError } from "../../utils/appError.js";

export class TextParser {
  /**
   * Parse plain text string into structured extracted fields.
   */
  static parse(rawText = "") {
    if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
      throw new AppError("Input text content cannot be empty", 400, "EMPTY_CONTENT");
    }

    const trimmed = rawText.trim();
    const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);

    const extracted = {
      title: "",
      site: "",
      facility: "",
      location: "",
      activity: "",
      reportType: "",
      eventDate: null,
      description: "",
      equipment: [],
      rawText: trimmed,
    };

    const remainingLines = [];

    // Check for standard key: value header lines
    for (const line of lines) {
      const match = line.match(/^(title|site|facility|location|activity|type|report\s*type|date|event\s*date|equipment|department|severity):\s*(.*)$/i);
      if (match) {
        const key = match[1].toLowerCase().replace(/\s+/g, "");
        const value = match[2].trim();

        if (key === "title") extracted.title = value;
        else if (key === "site") extracted.site = value;
        else if (key === "facility") extracted.facility = value;
        else if (key === "location") extracted.location = value;
        else if (key === "activity") extracted.activity = value;
        else if (key === "type" || key === "reporttype") extracted.reportType = value.toUpperCase().replace(/\s+/g, "_");
        else if (key === "date" || key === "eventdate") {
          const parsedDate = new Date(value);
          if (!isNaN(parsedDate.getTime())) extracted.eventDate = parsedDate;
        } else if (key === "equipment") {
          extracted.equipment = value.split(/[,;]/).map((e) => e.trim()).filter(Boolean);
        } else if (key === "department") {
          extracted.department = value;
        }
      } else {
        remainingLines.push(line);
      }
    }

    // Description is the remaining body text or full text
    extracted.description = remainingLines.length > 0 ? remainingLines.join("\n") : trimmed;
    if (!extracted.title && lines.length > 0) {
      extracted.title = lines[0].length > 80 ? lines[0].substring(0, 77) + "..." : lines[0];
    }

    return extracted;
  }
}

export default TextParser;
