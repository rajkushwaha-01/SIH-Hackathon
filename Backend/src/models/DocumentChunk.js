import mongoose from "mongoose";

const chunkMetadataSchema = new mongoose.Schema(
  {
    site: { type: String, default: "Main Site" },
    activity: { type: String, default: "General Work" },
    location: { type: String, default: "General Area" },
    reportType: { type: String, default: "OBSERVATION" },
    sifStatus: { type: String, default: "NON_SIF" },
    precursors: [{ type: String }],
    hazards: [{ type: String }],
    riskScore: { type: Number, default: 0 },
    eventDate: { type: Date, default: Date.now },
    sourceType: { type: String, default: "TEXT" },
    textSnippet: { type: String, default: "" },
  },
  { _id: false }
);

const documentChunkSchema = new mongoose.Schema(
  {
    chunkId: {
      type: String,
      required: [true, "Chunk ID is required"],
      unique: true,
      index: true,
    },
    reportId: {
      type: String,
      ref: "SafetyReport",
      required: [true, "Report ID reference is required"],
      index: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
      default: 0,
    },
    content: {
      type: String,
      required: [true, "Chunk content is required"],
      trim: true,
    },
    tokenCount: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: chunkMetadataSchema,
      required: true,
    },
    embeddingModel: {
      type: String,
      default: "text-embedding-004",
    },
    embeddingDimension: {
      type: Number,
      default: 768,
    },
    isIndexedInPinecone: {
      type: Boolean,
      default: false,
      index: true,
    },
    indexedAt: {
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

// Compound indexes for chunk retrieval and report queries
documentChunkSchema.index({ reportId: 1, chunkIndex: 1 });
documentChunkSchema.index({ isIndexedInPinecone: 1, createdAt: -1 });

export const DocumentChunk = mongoose.model("DocumentChunk", documentChunkSchema);
export default DocumentChunk;
