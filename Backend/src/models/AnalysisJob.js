import mongoose from "mongoose";

const jobStepStatus = ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "SKIPPED"];

const stepsSchema = new mongoose.Schema(
  {
    ingestion: { type: String, enum: jobStepStatus, default: "COMPLETED" },
    normalization: { type: String, enum: jobStepStatus, default: "COMPLETED" },
    nlp: { type: String, enum: jobStepStatus, default: "PENDING" },
    sif: { type: String, enum: jobStepStatus, default: "PENDING" },
    precursor: { type: String, enum: jobStepStatus, default: "PENDING" },
    riskScoring: { type: String, enum: jobStepStatus, default: "PENDING" },
    embedding: { type: String, enum: jobStepStatus, default: "PENDING" },
    vectorIndex: { type: String, enum: jobStepStatus, default: "PENDING" },
  },
  { _id: false }
);

const analysisJobSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: [true, "Job ID is required"],
      unique: true,
      index: true,
    },
    reportId: {
      type: String,
      ref: "SafetyReport",
      required: [true, "Report ID is required"],
      index: true,
    },
    status: {
      type: String,
      enum: ["QUEUED", "PROCESSING", "COMPLETED", "FAILED", "RETRYING"],
      default: "QUEUED",
      index: true,
    },
    steps: {
      type: stepsSchema,
      default: () => ({}),
    },
    currentStep: {
      type: String,
      default: "nlp",
    },
    attempts: {
      type: Number,
      default: 1,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    error: {
      step: String,
      message: String,
      stack: String,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
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

export const AnalysisJob = mongoose.model("AnalysisJob", analysisJobSchema);
export default AnalysisJob;
