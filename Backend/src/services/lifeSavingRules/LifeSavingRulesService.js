import mongoose from "mongoose";
import { LifeSavingRule } from "../../models/LifeSavingRule.js";
import { OFFICIAL_IOGP_RULES } from "../../constants/lifeSavingRules.constants.js";
import { AppError } from "../../utils/appError.js";
import { logger } from "../../utils/logger.js";

export class LifeSavingRulesService {
  /**
   * Seed / Synchronize official IOGP Life-Saving Rules into MongoDB.
   */
  static async seedRules() {
    try {
      if (mongoose.connection.readyState !== 1) {
        logger.warn("MongoDB not connected; skipping database upsert for IOGP rules.");
        return { count: OFFICIAL_IOGP_RULES.length, status: "MEMORY_ONLY" };
      }

      for (const rule of OFFICIAL_IOGP_RULES) {
        await LifeSavingRule.findOneAndUpdate(
          { code: rule.code },
          { $set: rule },
          { upsert: true, new: true }
        );
      }
      logger.info(`Successfully seeded/synchronized ${OFFICIAL_IOGP_RULES.length} official IOGP Life-Saving Rules.`);
      return { count: OFFICIAL_IOGP_RULES.length, status: "SEEDED" };
    } catch (error) {
      logger.error("Error seeding IOGP Life-Saving Rules:", error);
      throw error;
    }
  }

  /**
   * Get all official IOGP Life-Saving Rules.
   */
  static async getAllRules() {
    if (mongoose.connection.readyState === 1) {
      const rules = await LifeSavingRule.find().sort({ ruleId: 1 });
      if (rules && rules.length > 0) return rules;
    }
    // Fallback to official static constants if DB not connected or empty
    return OFFICIAL_IOGP_RULES;
  }

  /**
   * Get rule by ruleId or code.
   */
  static async getRuleById(identifier = "") {
    const cleanId = identifier.trim().toUpperCase();

    if (mongoose.connection.readyState === 1) {
      const rule = await LifeSavingRule.findOne({
        $or: [{ ruleId: cleanId }, { code: cleanId }],
      });
      if (rule) return rule;
    }

    const constantRule = OFFICIAL_IOGP_RULES.find(
      (r) => r.ruleId === cleanId || r.code === cleanId
    );

    if (!constantRule) {
      throw new AppError(`IOGP Life-Saving Rule '${identifier}' was not found`, 404, "RULE_NOT_FOUND");
    }

    return constantRule;
  }

  /**
   * Deterministically map safety report and detected precursors to official IOGP Life-Saving Rules.
   */
  static mapLifeSavingRules(report, nlpExtraction = {}, detectedPrecursors = []) {
    const text = (report.originalContent || report.normalizedReport?.description || "").toLowerCase();
    const mappedRules = [];
    const precursorTypes = (detectedPrecursors || []).map((p) => p.type || p);

    for (const rule of OFFICIAL_IOGP_RULES) {
      let isMapped = false;
      let mappingReason = "";
      let confidence = 0.85;
      let evidenceText = "";

      // 1. Check if any detected precursor directly matches rule's applicable precursors
      const matchingPrecursor = precursorTypes.find((pt) => rule.applicablePrecursors.includes(pt));
      if (matchingPrecursor) {
        isMapped = true;
        confidence = 0.95;
        mappingReason = `Direct precursor mapping: Incident involves '${matchingPrecursor}', which directly violates official IOGP rule '${rule.officialName}'.`;
        
        // Find evidence text from matching precursor if available
        const matchedPrecObj = detectedPrecursors.find((p) => p.type === matchingPrecursor);
        evidenceText = matchedPrecObj?.evidenceText || text.substring(0, 150);
      }

      // 2. Check keyword trigger conditions in narrative text
      if (!isMapped) {
        const matchingTrigger = rule.triggerConditions.find((trigger) => text.includes(trigger.toLowerCase()));
        if (matchingTrigger) {
          isMapped = true;
          confidence = 0.88;
          mappingReason = `Textual condition mapping: Identified trigger term '${matchingTrigger}' linked to standard IOGP mandatory action for '${rule.officialName}'.`;
          evidenceText = text.substring(0, 150);
        }
      }

      if (isMapped) {
        mappedRules.push({
          ruleId: rule.ruleId,
          ruleName: rule.officialName,
          mappingReason,
          confidence,
          evidenceText: evidenceText || "Textual evidence indicates rule applicability.",
        });
      }
    }

    return mappedRules;
  }
}

export default LifeSavingRulesService;
