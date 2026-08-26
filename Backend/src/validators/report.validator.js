import { z } from "zod";
import {
  REPORT_TYPES,
  SOURCE_TYPES,
  INJURY_SEVERITY,
  DAMAGE_SEVERITY,
} from "../constants/report.constants.js";

export const createReportSchema = z.object({
  reportId: z.string().trim().optional(),
  sourceType: z.enum(SOURCE_TYPES).optional().default("TEXT"),
  rawText: z.string({ required_error: "Report text or description is required" }).min(5, "Description must be at least 5 characters"),
  title: z.string().trim().max(150).optional(),
  reportType: z.enum(REPORT_TYPES).optional().default("OBSERVATION"),
  eventDate: z.string().or(z.date()).optional(),
  site: z.string().trim().optional(),
  facility: z.string().trim().optional(),
  location: z.string().trim().optional(),
  department: z.string().trim().optional(),
  activity: z.string().trim().optional(),
  equipment: z.array(z.string()).or(z.string()).optional(),
  reporterRole: z.string().trim().optional(),
  actualOutcome: z
    .object({
      injurySeverity: z.enum(INJURY_SEVERITY).optional().default("NONE"),
      damageSeverity: z.enum(DAMAGE_SEVERITY).optional().default("NONE"),
      description: z.string().trim().optional().default(""),
    })
    .optional(),
});

export const updateReportSchema = z.object({
  title: z.string().trim().max(150).optional(),
  reportType: z.enum(REPORT_TYPES).optional(),
  eventDate: z.string().or(z.date()).optional(),
  site: z.string().trim().optional(),
  facility: z.string().trim().optional(),
  location: z.string().trim().optional(),
  department: z.string().trim().optional(),
  activity: z.string().trim().optional(),
  equipment: z.array(z.string()).optional(),
  description: z.string().trim().min(5).optional(),
  actualOutcome: z
    .object({
      injurySeverity: z.enum(INJURY_SEVERITY).optional(),
      damageSeverity: z.enum(DAMAGE_SEVERITY).optional(),
      description: z.string().trim().optional(),
    })
    .optional(),
});

export const reportQuerySchema = z.object({
  site: z.string().trim().optional(),
  activity: z.string().trim().optional(),
  location: z.string().trim().optional(),
  reportType: z.string().trim().optional(),
  status: z.string().trim().optional(),
  isDuplicate: z
    .string()
    .optional()
    .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().trim().optional(),
  page: z.string().optional().default("1").transform((val) => Math.max(1, parseInt(val, 10) || 1)),
  limit: z.string().optional().default("20").transform((val) => Math.min(100, Math.max(1, parseInt(val, 10) || 20))),
  sortBy: z.string().optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export default {
  createReportSchema,
  updateReportSchema,
  reportQuerySchema,
};
