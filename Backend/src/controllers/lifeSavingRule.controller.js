import { LifeSavingRulesService } from "../services/lifeSavingRules/LifeSavingRulesService.js";
import { Analysis } from "../models/Analysis.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const getRules = async (req, res, next) => {
  try {
    const rules = await LifeSavingRulesService.getAllRules();
    return sendSuccess(res, rules, "Official IOGP Life-Saving Rules retrieved", 200);
  } catch (error) {
    next(error);
  }
};

export const getRuleById = async (req, res, next) => {
  try {
    const rule = await LifeSavingRulesService.getRuleById(req.params.id);
    return sendSuccess(res, rule, `IOGP Life-Saving Rule details for ${req.params.id}`, 200);
  } catch (error) {
    next(error);
  }
};

export const getRuleAnalytics = async (req, res, next) => {
  try {
    const rule = await LifeSavingRulesService.getRuleById(req.params.id);

    const reportCount = await Analysis.countDocuments({
      isLatest: true,
      "lifeSavingRuleMappings.ruleId": rule.ruleId,
    });

    const sifCount = await Analysis.countDocuments({
      isLatest: true,
      "lifeSavingRuleMappings.ruleId": rule.ruleId,
      "sifClassification.classification": "SIF_POTENTIAL",
    });

    return sendSuccess(
      res,
      {
        rule,
        incidentOccurrences: reportCount,
        sifPotentialOccurrences: sifCount,
        sifRate: reportCount > 0 ? Math.round((sifCount / reportCount) * 100) : 0,
      },
      `Analytics for IOGP Life-Saving Rule ${rule.officialName}`,
      200
    );
  } catch (error) {
    next(error);
  }
};

export default {
  getRules,
  getRuleById,
  getRuleAnalytics,
};
