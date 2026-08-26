import mongoose from "mongoose";

const derivedConclusionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true, // e.g. "SIF_PRECURSOR", "BARRIER_FAILURE", "HAZARD_IDENTIFICATION"
    },
    value: {
      type: String,
      required: true, // e.g. "ENERGY_EXPOSURE", "LOCKOUT_TAGOUT_MISSING"
    },
  },
  { _id: false }
);

const evidenceSchema = new mongoose.Schema(
  {
    evidenceId: {
      type: String,
      required: [true, "Evidence ID is required"],
      unique: true,
      index: true,
    },
    reportId: {
      type: String,
      ref: "SafetyReport",
      required: [true, "Report ID reference is required"],
      index: true,
    },
    sourceType: {
      type: String,
      enum: ["REPORT_TEXT", "CHUNK", "ATTACHMENT", "MANUAL_ENTRY"],
      default: "REPORT_TEXT",
    },
    text: {
      type: String,
      required: [true, "Evidence quote text is required"],
      trim: true,
    },
    page: {
      type: Number,
      default: 1,
    },
    section: {
      type: String,
      trim: true,
      default: "Event Description",
    },
    offsets: {
      start: { type: Number, default: 0 },
      end: { type: Number, default: 0 },
    },
    derivedConclusions: [derivedConclusionSchema],
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

export const Evidence = mongoose.model("Evidence", evidenceSchema);
export default Evidence;
