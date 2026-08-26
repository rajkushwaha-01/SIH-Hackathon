import mongoose from "mongoose";

const barrierSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, default: "ENGINEERING" },
    status: { type: String, default: "PRESENT_EFFECTIVE" },
  },
  { _id: false }
);

const impactFactorSchema = new mongoose.Schema(
  {
    factor: { type: String, required: true },
    impact: { type: Number, required: true },
    reason: { type: String, required: true },
  },
  { _id: false }
);

const simulationSchema = new mongoose.Schema(
  {
    simulationId: {
      type: String,
      required: [true, "Simulation ID is required"],
      unique: true,
      index: true,
    },
    scenarioName: {
      type: String,
      required: [true, "Scenario name is required"],
      trim: true,
    },
    baseReportId: {
      type: String,
      default: null,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    baseline: {
      riskScore: { type: Number, required: true },
      riskLevel: { type: String, required: true },
      sifClassification: { type: String, required: true },
      barriers: [barrierSnapshotSchema],
      precursors: [{ type: String }],
    },
    simulated: {
      riskScore: { type: Number, required: true },
      riskLevel: { type: String, required: true },
      sifClassification: { type: String, required: true },
      barriers: [barrierSnapshotSchema],
      precursors: [{ type: String }],
    },
    delta: {
      scoreDifference: { type: Number, required: true }, // Negative means reduction, positive means escalation
      levelChanged: { type: Boolean, default: false },
      sifStatusChanged: { type: Boolean, default: false },
      mitigationEfficacy: { type: Number, default: 0 }, // % reduction in risk score
      impactFactors: [impactFactorSchema],
    },
    scenarioExplanation: {
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

simulationSchema.index({ baseReportId: 1, createdAt: -1 });

export const Simulation = mongoose.model("Simulation", simulationSchema);
export default Simulation;
