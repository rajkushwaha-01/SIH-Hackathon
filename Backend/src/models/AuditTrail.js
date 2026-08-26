import mongoose from "mongoose";

const auditTrailSchema = new mongoose.Schema(
  {
    auditId: {
      type: String,
      required: [true, "Audit ID is required"],
      unique: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ["REPORT", "ANALYSIS", "ALERT", "PATTERN", "SIMULATION"],
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        "REPORT_INGESTED",
        "AI_ANALYSIS_COMPLETED",
        "HUMAN_REVIEW_APPROVED",
        "HUMAN_REVIEW_REJECTED",
        "HUMAN_OVERRIDE_APPLIED",
        "ALERT_RESOLVED",
        "PATTERN_STATUS_UPDATED",
      ],
      required: true,
      index: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    performedByName: {
      type: String,
      default: "System AI Pipeline",
    },
    performedByRole: {
      type: String,
      default: "SYSTEM",
    },
    previousState: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newState: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    justification: {
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

auditTrailSchema.index({ entityId: 1, createdAt: -1 });

export const AuditTrail = mongoose.model("AuditTrail", auditTrailSchema);
export default AuditTrail;
