import mongoose from "mongoose";
import {
  REPORT_TYPES,
  SOURCE_TYPES,
  REPORT_STATUS,
  INJURY_SEVERITY,
  DAMAGE_SEVERITY,
  VECTOR_STATUS,
  DUPLICATE_TYPES,
} from "../constants/report.constants.js";

const actualOutcomeSchema = new mongoose.Schema(
  {
    injurySeverity: {
      type: String,
      enum: INJURY_SEVERITY,
      default: "NONE",
    },
    damageSeverity: {
      type: String,
      enum: DAMAGE_SEVERITY,
      default: "NONE",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const normalizedReportSchema = new mongoose.Schema(
  {
    reportType: {
      type: String,
      enum: REPORT_TYPES,
      required: [true, "Report type is required"],
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: "Untitled Safety Observation",
    },
    description: {
      type: String,
      required: [true, "Report description is required"],
      trim: true,
    },
    eventDate: {
      type: Date,
      required: [true, "Event date is required"],
      default: Date.now,
      index: true,
    },
    site: {
      type: String,
      required: [true, "Site is required"],
      trim: true,
      index: true,
    },
    facility: {
      type: String,
      trim: true,
      default: "General Facility",
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      index: true,
    },
    department: {
      type: String,
      trim: true,
      default: "Operations",
    },
    activity: {
      type: String,
      required: [true, "Activity is required"],
      trim: true,
      index: true,
    },
    equipment: {
      type: [String],
      default: [],
    },
    reporterRole: {
      type: String,
      trim: true,
      default: "Worker",
    },
    actualOutcome: {
      type: actualOutcomeSchema,
      default: () => ({}),
    },
  },
  { _id: false }
);

const safetyReportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      required: [true, "Report ID is required"],
      unique: true,
      trim: true,
      index: true,
    },
    sourceType: {
      type: String,
      enum: SOURCE_TYPES,
      required: [true, "Source type is required"],
      index: true,
    },
    originalFileName: {
      type: String,
      trim: true,
      default: null,
    },
    originalContent: {
      type: String,
      required: [true, "Original content is required"],
    },
    contentHash: {
      type: String,
      required: [true, "Content hash is required"],
      index: true,
    },
    normalizedReport: {
      type: normalizedReportSchema,
      required: true,
    },
    status: {
      type: String,
      enum: REPORT_STATUS,
      default: "INGESTED",
      index: true,
    },
    isDuplicate: {
      type: Boolean,
      default: false,
      index: true,
    },
    duplicateOf: {
      type: String,
      default: null,
      index: true,
    },
    duplicateType: {
      type: String,
      enum: DUPLICATE_TYPES,
      default: null,
    },
    vectorStatus: {
      type: String,
      enum: VECTOR_STATUS,
      default: "PENDING",
      index: true,
    },
    lastAnalyzedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for high-frequency filtering and dashboard queries
safetyReportSchema.index({ "normalizedReport.site": 1, "normalizedReport.eventDate": -1 });
safetyReportSchema.index({ "normalizedReport.activity": 1, "normalizedReport.reportType": 1 });
safetyReportSchema.index({ createdAt: -1 });

export const SafetyReport = mongoose.model("SafetyReport", safetyReportSchema);
export default SafetyReport;
