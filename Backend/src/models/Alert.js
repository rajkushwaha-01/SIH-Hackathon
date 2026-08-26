import mongoose from "mongoose";

const recommendedActionSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    assignedRole: { type: String, default: "HSE_OFFICER" },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const alertSchema = new mongoose.Schema(
  {
    alertId: {
      type: String,
      required: [true, "Alert ID is required"],
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Alert title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    triggerType: {
      type: String,
      enum: [
        "CRITICAL_SIF_EMERGENCE",
        "SYSTEMIC_BARRIER_BREAKDOWN",
        "RECURRING_PATTERN_DETECTED",
        "MULTIPLE_PRECURSOR_CONVERGENCE",
      ],
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ["P1_CRITICAL", "P2_HIGH", "P3_MEDIUM", "P4_LOW"],
      default: "P2_HIGH",
      index: true,
    },
    status: {
      type: String,
      enum: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "DISMISSED"],
      default: "OPEN",
      index: true,
    },
    sourceReportId: {
      type: String,
      default: null,
      index: true,
    },
    sourcePatternId: {
      type: String,
      default: null,
    },
    site: {
      type: String,
      default: "General Site",
      index: true,
    },
    targetPrecursor: {
      type: String,
      default: "",
    },
    deduplicationKey: {
      type: String,
      index: true,
    },
    recommendedActions: [recommendedActionSchema],
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolutionNotes: {
      type: String,
      default: "",
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

alertSchema.index({ priority: 1, status: 1, createdAt: -1 });

export const Alert = mongoose.model("Alert", alertSchema);
export default Alert;
