import { PatternDetectionService } from "../services/pattern/PatternDetectionService.js";
import { AppError } from "../utils/appError.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const detectPatterns = async (_req, res, next) => {
  try {
    const patterns = await PatternDetectionService.mineRecurringPatterns();
    return sendSuccess(
      res,
      { count: patterns.length, patterns },
      "Recurring pattern detection analysis completed",
      200
    );
  } catch (error) {
    next(error);
  }
};

export const getPatterns = async (req, res, next) => {
  try {
    const patterns = await PatternDetectionService.getPatterns(req.query);
    return sendSuccess(res, patterns, "Recurring safety patterns retrieved", 200);
  } catch (error) {
    next(error);
  }
};

export const getPatternById = async (req, res, next) => {
  try {
    const pattern = await PatternDetectionService.getPatternById(req.params.id);
    return sendSuccess(res, pattern, `Details for pattern ${req.params.id}`, 200);
  } catch (error) {
    next(error);
  }
};

export const updatePatternStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ["ACTIVE", "UNDER_REVIEW", "MITIGATED", "DISMISSED"];

    if (!status || !allowed.includes(status)) {
      throw new AppError(
        `Invalid pattern status '${status}'. Allowed values: ${allowed.join(", ")}`,
        400,
        "INVALID_STATUS"
      );
    }

    const updated = await PatternDetectionService.updateStatus(req.params.id, status);
    return sendSuccess(res, updated, `Pattern status updated to ${status}`, 200);
  } catch (error) {
    next(error);
  }
};

export default {
  detectPatterns,
  getPatterns,
  getPatternById,
  updatePatternStatus,
};
