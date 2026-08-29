import { AnalysisQueue } from "../jobs/AnalysisQueue.js";
import { Analysis } from "../models/Analysis.js";
import { SafetyReport } from "../models/SafetyReport.js";
import { ExtractionService } from "../services/nlp/ExtractionService.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { AppError } from "../utils/appError.js";

export const triggerAnalysis = async (req, res, next) => {
  try {
    const job = await AnalysisQueue.enqueueJob(req.params.id);
    return sendSuccess(res, job, "Analysis job queued successfully", 202);
  } catch (error) {
    next(error);
  }
};

export const triggerReportAnalysis = triggerAnalysis;

export const reanalyzeReport = async (req, res, next) => {
  try {
    // Re-run synchronous extraction and return updated analysis
    const result = await ExtractionService.extractAndPersist(req.params.id);
    return sendSuccess(res, result.analysis, "Report re-analyzed successfully", 200);
  } catch (error) {
    next(error);
  }
};

export const getJobStatus = async (req, res, next) => {
  try {
    const job = await AnalysisQueue.getJobStatus(req.params.jobId);
    return sendSuccess(res, job, "Job status retrieved successfully", 200);
  } catch (error) {
    next(error);
  }
};

export const getAnalysisByReportId = async (req, res, next) => {
  try {
    const rawId = req.params.reportId || req.params.id;
    const isObjectId = rawId?.match(/^[0-9a-fA-F]{24}$/);
    let targetReportId = rawId;
    if (isObjectId) {
      const report = await SafetyReport.findOne({ $or: [{ _id: rawId }, { reportId: rawId }] });
      if (report) targetReportId = report.reportId;
    }

    const analysis = await Analysis.findOne({
      $or: [{ reportId: targetReportId }, { reportId: rawId }],
      isLatest: true,
    }).populate("evidenceIds");

    if (!analysis) {
      throw new AppError(`No completed analysis found for report '${rawId}'`, 404, "ANALYSIS_NOT_FOUND");
    }

    return sendSuccess(res, analysis, "Analysis intelligence retrieved successfully", 200);
  } catch (error) {
    next(error);
  }
};

export default {
  triggerAnalysis,
  triggerReportAnalysis,
  reanalyzeReport,
  getJobStatus,
  getAnalysisByReportId,
};
