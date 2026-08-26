import { ReviewService } from "../services/review/ReviewService.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const getReportDetail = async (req, res, next) => {
  try {
    const detail = await ReviewService.getReportDetail(req.params.id);
    return sendSuccess(res, detail, `Complete report detail for ${req.params.id}`, 200);
  } catch (error) {
    next(error);
  }
};

export const submitReview = async (req, res, next) => {
  try {
    const result = await ReviewService.submitReview({
      reportId: req.params.id,
      ...req.body,
      user: req.user,
    });
    return sendSuccess(res, result, `Human HSE review decision applied for ${req.params.id}`, 200);
  } catch (error) {
    next(error);
  }
};

export const getAuditTrail = async (req, res, next) => {
  try {
    const auditTrail = await ReviewService.getAuditTrail(req.params.id);
    return sendSuccess(res, auditTrail, `Audit trail for ${req.params.id}`, 200);
  } catch (error) {
    next(error);
  }
};

export default {
  getReportDetail,
  submitReview,
  getAuditTrail,
};
