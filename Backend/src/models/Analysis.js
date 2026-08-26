import mongoose from "mongoose";

const barrierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ["ELIMINATION", "SUBSTITUTION", "ENGINEERING", "ADMINISTRATIVE", "PPE", "PROCEDURAL", "HUMAN"],
      default: "ENGINEERING",
    },
    status: {
      type: String,
      enum: ["PRESENT_EFFECTIVE", "DEGRADED", "FAILED", "MISSING"],
      default: "PRESENT_EFFECTIVE",
    },
    evidenceText: { type: String, default: "" },
  },
  { _id: false }
);

const energySourceSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    magnitude: { type: String, default: "HIGH" },
    controlled: { type: Boolean, default: false },
  },
  { _id: false }
);

const hazardSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, default: "PROCESS_SAFETY" },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const nlpExtractionSchema = new mongoose.Schema(
  {
    activity: { type: String, default: "" },
    hazards: [hazardSchema],
    energySources: [energySourceSchema],
    equipment: [{ type: String }],
    location: { type: String, default: "" },
    peopleInvolved: [{ type: String }],
    unsafeActs: [{ type: String }],
    unsafeConditions: [{ type: String }],
    barriers: [barrierSchema],
    consequences: {
      potentialInjuries: [{ type: String }],
      potentialFatalities: { type: Boolean, default: false },
      worstCaseConsequence: { type: String, default: "" },
    },
    actualOutcome: { type: String, default: "" },
    potentialOutcome: { type: String, default: "" },
  },
  { _id: false }
);

const sifClassificationSchema = new mongoose.Schema(
  {
    classification: {
      type: String,
      enum: ["SIF_POTENTIAL", "NON_SIF", "NEEDS_REVIEW"],
      required: true,
      index: true,
    },
    modelConfidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },
    classificationReason: { type: String, required: true },
    isHighPotentialEvent: { type: Boolean, default: false },
    actualVsPotentialDistinction: {
      actualOutcome: { type: String, default: "" },
      potentialOutcome: { type: String, default: "" },
      divergenceReason: { type: String, default: "" },
    },
  },
  { _id: false }
);

const precursorSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    confidence: { type: Number, min: 0, max: 1, default: 0.8 },
    severity: {
      type: String,
      enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
      default: "HIGH",
    },
    evidenceText: { type: String, default: "" },
    failedBarriers: [{ type: String }],
  },
  { _id: false }
);

const lifeSavingRuleMappingSchema = new mongoose.Schema(
  {
    ruleId: { type: String, required: true },
    ruleName: { type: String, required: true },
    mappingReason: { type: String, required: true },
    confidence: { type: Number, min: 0, max: 1, default: 0.85 },
    evidenceText: { type: String, default: "" },
  },
  { _id: false }
);

const riskFactorSchema = new mongoose.Schema(
  {
    factor: { type: String, required: true },
    weight: { type: Number, required: true },
    impact: { type: Number, required: true },
    reason: { type: String, required: true },
  },
  { _id: false }
);

const riskScoreSchema = new mongoose.Schema(
  {
    score: { type: Number, min: 0, max: 100, required: true, index: true },
    level: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      required: true,
      index: true,
    },
    dominantFactor: { type: String, default: "" },
    factors: [riskFactorSchema],
  },
  { _id: false }
);

const recommendationSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    hierarchyLevel: {
      type: String,
      enum: ["ELIMINATION", "SUBSTITUTION", "ENGINEERING", "ADMINISTRATIVE", "PPE"],
      default: "ENGINEERING",
    },
    targetBarrier: { type: String, default: "" },
  },
  { _id: false }
);

const analysisSchema = new mongoose.Schema(
  {
    analysisId: {
      type: String,
      required: [true, "Analysis ID is required"],
      unique: true,
      index: true,
    },
    reportId: {
      type: String,
      ref: "SafetyReport",
      required: [true, "Report ID reference is required"],
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    isLatest: {
      type: Boolean,
      default: true,
      index: true,
    },
    aiMetadata: {
      model: { type: String, default: "gemini-2.5-flash" },
      promptVersion: { type: String, default: "sif-v1.0" },
      taxonomyVersion: { type: String, default: "precursor-v1.0" },
      riskEngineVersion: { type: String, default: "risk-calc-v1.0" },
      lifeSavingRulesVersion: { type: String, default: "iogp-v1.0" },
      executionTimeMs: { type: Number, default: 0 },
    },
    nlpExtraction: {
      type: nlpExtractionSchema,
      required: true,
    },
    sifClassification: {
      type: sifClassificationSchema,
      required: true,
    },
    precursors: [precursorSchema],
    lifeSavingRuleMappings: [lifeSavingRuleMappingSchema],
    riskScore: {
      type: riskScoreSchema,
      required: true,
    },
    priority: {
      level: {
        type: String,
        enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        default: "MEDIUM",
        index: true,
      },
      reasons: [{ type: String }],
    },
    recommendations: [recommendationSchema],
    evidenceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Evidence" }],
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

// Indexes
analysisSchema.index({ reportId: 1, version: -1 });
analysisSchema.index({ "sifClassification.classification": 1, "riskScore.level": 1 });
analysisSchema.index({ "precursors.type": 1 });

export const Analysis = mongoose.model("Analysis", analysisSchema);
export default Analysis;
