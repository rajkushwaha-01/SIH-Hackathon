import mongoose from "mongoose";

const lifeSavingRuleSchema = new mongoose.Schema(
  {
    ruleId: {
      type: String,
      required: [true, "Rule ID is required"],
      unique: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    officialName: {
      type: String,
      required: [true, "Official rule name is required"],
      trim: true,
    },
    icon: {
      type: String,
      default: "shield",
    },
    version: {
      type: String,
      default: "IOGP-2020-v1",
      index: true,
    },
    description: {
      type: String,
      required: [true, "Official description is required"],
    },
    source: {
      type: String,
      default: "IOGP Report 459 - Life-Saving Rules (2020 Edition)",
    },
    sourceUrl: {
      type: String,
      default: "https://www.iogp.org/life-savingrules/",
    },
    applicablePrecursors: [{ type: String }],
    applicableHazards: [{ type: String }],
    mandatoryActions: [{ type: String }],
    triggerConditions: [{ type: String }],
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

export const LifeSavingRule = mongoose.model("LifeSavingRule", lifeSavingRuleSchema);
export default LifeSavingRule;
