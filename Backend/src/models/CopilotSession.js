import mongoose from "mongoose";

const citationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["REPORT", "IOGP_RULE", "PRECURSOR", "BARRIER", "REGULATION"],
      required: true,
    },
    identifier: { type: String, required: true }, // e.g. "INC-2026-001" or "IOGP-LSR-04"
    title: { type: String, default: "" },
    textExcerpt: { type: String, default: "" },
  },
  { _id: false }
);

const chatMessageSchema = new mongoose.Schema(
  {
    messageId: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: { type: String, required: true },
    citations: [citationSchema],
    suggestedFollowUps: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const copilotSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: [true, "Session ID is required"],
      unique: true,
      index: true,
    },
    title: {
      type: String,
      default: "New HSE Investigation",
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    contextScope: {
      site: { type: String, default: "" },
      precursor: { type: String, default: "" },
      reportId: { type: String, default: "" },
    },
    messages: [chatMessageSchema],
    messageCount: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: Date.now },
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

copilotSessionSchema.index({ userId: 1, lastActiveAt: -1 });

export const CopilotSession = mongoose.model("CopilotSession", copilotSessionSchema);
export default CopilotSession;
