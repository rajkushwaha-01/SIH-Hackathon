import mongoose from "mongoose";

const graphNodeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      enum: ["PRECURSOR", "BARRIER", "ENERGY_SOURCE", "UNSAFE_ACT", "LIFE_SAVING_RULE", "CONSEQUENCE", "EVENT"],
      required: true,
    },
    weight: { type: Number, default: 1 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const graphEdgeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    relationship: {
      type: String,
      enum: ["CAUSES", "FAILS", "VIOLATES", "LEADS_TO", "ASSOCIATED_WITH"],
      required: true,
    },
    weight: { type: Number, default: 1 },
    evidenceSnippets: [{ type: String }],
  },
  { _id: false }
);

const causalGraphSchema = new mongoose.Schema(
  {
    graphId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    scope: {
      type: String,
      enum: ["ENTERPRISE", "SITE", "PRECURSOR", "REPORT"],
      default: "ENTERPRISE",
      index: true,
    },
    targetIdentifier: {
      type: String,
      default: "ALL",
      index: true,
    },
    nodes: [graphNodeSchema],
    edges: [graphEdgeSchema],
    nodeCount: { type: Number, default: 0 },
    edgeCount: { type: Number, default: 0 },
    highRiskPathwaysCount: { type: Number, default: 0 },
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

export const CausalGraph = mongoose.model("CausalGraph", causalGraphSchema);
export default CausalGraph;
