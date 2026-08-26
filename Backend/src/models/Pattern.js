import mongoose from "mongoose";

const patternDimensionsSchema = new mongoose.Schema(
  {
    precursor: { type: String, default: "" },
    site: { type: String, default: "" },
    activity: { type: String, default: "" },
    failedBarrier: { type: String, default: "" },
  },
  { _id: false }
);

const interventionSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    hierarchyLevel: {
      type: String,
      enum: ["ELIMINATION", "SUBSTITUTION", "ENGINEERING", "ADMINISTRATIVE", "PPE"],
      default: "ENGINEERING",
    },
  },
  { _id: false }
);

const patternSchema = new mongoose.Schema(
  {
    patternId: {
      type: String,
      required: [true, "Pattern ID is required"],
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Pattern name is required"],
      trim: true,
    },
    dimensions: {
      type: patternDimensionsSchema,
      required: true,
    },
    incidentCount: {
      type: Number,
      default: 0,
    },
    sifPotentialCount: {
      type: Number,
      default: 0,
    },
    sifRate: {
      type: Number,
      default: 0,
    },
    severity: {
      type: String,
      enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
      default: "HIGH",
      index: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.85,
    },
    firstSeenAt: {
      type: Date,
      default: Date.now,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
    sampleReportIds: [{ type: String }],
    commonFactors: [{ type: String }],
    recommendedInterventions: [interventionSchema],
    status: {
      type: String,
      enum: ["ACTIVE", "UNDER_REVIEW", "MITIGATED", "DISMISSED"],
      default: "ACTIVE",
      index: true,
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

patternSchema.index({ severity: 1, status: 1 });
patternSchema.index({ "dimensions.site": 1, "dimensions.precursor": 1 });

export const Pattern = mongoose.model("Pattern", patternSchema);
export default Pattern;
