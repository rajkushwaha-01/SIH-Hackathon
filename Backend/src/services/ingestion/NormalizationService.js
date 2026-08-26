import { REPORT_TYPES, INJURY_SEVERITY, DAMAGE_SEVERITY } from "../../constants/report.constants.js";

export class NormalizationService {
  /**
   * Standardizes report types into canonical enums.
   */
  static normalizeReportType(typeStr = "") {
    if (!typeStr) return "OBSERVATION";
    const clean = typeStr.toUpperCase().trim().replace(/[\s_-]+/g, "_");

    if (REPORT_TYPES.includes(clean)) return clean;

    if (clean.includes("UNSAFE_ACT") || clean === "UA") return "UNSAFE_ACT";
    if (clean.includes("UNSAFE_COND") || clean === "UC") return "UNSAFE_CONDITION";
    if (clean.includes("NEAR_MISS") || clean.includes("NEARMISS") || clean === "NM") return "NEAR_MISS";
    if (clean.includes("INCIDENT") || clean.includes("ACCIDENT")) return "INCIDENT";
    if (clean.includes("OBSERVATION") || clean.includes("HAZARD")) return "OBSERVATION";

    return "OBSERVATION";
  }

  /**
   * Normalizes an event date string or Date object.
   */
  static normalizeDate(dateVal) {
    if (!dateVal) return new Date();
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  /**
   * Standardizes severity strings.
   */
  static normalizeSeverity(severityStr = "", list = INJURY_SEVERITY) {
    if (!severityStr) return "NONE";
    const clean = severityStr.toUpperCase().trim().replace(/[\s_-]+/g, "_");
    return list.includes(clean) ? clean : "NONE";
  }

  /**
   * Normalizes any raw/parsed safety report object into the canonical normalizedReport schema.
   */
  static normalize(raw = {}) {
    const description = (raw.description || raw.narrative || raw.details || raw.rawText || "").trim();
    const title = (raw.title || (description ? description.substring(0, 60) + "..." : "Safety Observation")).trim();
    const reportType = NormalizationService.normalizeReportType(raw.reportType || raw.type);
    const eventDate = NormalizationService.normalizeDate(raw.eventDate || raw.date);

    return {
      reportType,
      title: title || "Safety Observation",
      description: description || "No detailed description provided.",
      eventDate,
      site: (raw.site || raw.plant || "Main Operations Site").trim(),
      facility: (raw.facility || raw.unit || "General Facility").trim(),
      location: (raw.location || raw.area || "General Work Area").trim(),
      department: (raw.department || "Operations").trim(),
      activity: (raw.activity || raw.task || "General Work Activity").trim(),
      equipment: Array.isArray(raw.equipment) ? raw.equipment : raw.equipment ? [raw.equipment] : [],
      reporterRole: (raw.reporterRole || "Worker").trim(),
      actualOutcome: {
        injurySeverity: NormalizationService.normalizeSeverity(raw.actualOutcome?.injurySeverity || raw.injurySeverity, INJURY_SEVERITY),
        damageSeverity: NormalizationService.normalizeSeverity(raw.actualOutcome?.damageSeverity || raw.damageSeverity, DAMAGE_SEVERITY),
        description: (raw.actualOutcome?.description || "").trim(),
      },
    };
  }
}

export default NormalizationService;
