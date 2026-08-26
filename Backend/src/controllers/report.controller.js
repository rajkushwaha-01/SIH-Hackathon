import { ReportIngestionService } from "../services/ingestion/ReportIngestionService.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const createReport = async (req, res, next) => {
  try {
    const report = await ReportIngestionService.createReport(req.body, req.user);
    return sendSuccess(res, report, "Safety report created successfully", 201);
  } catch (error) {
    next(error);
  }
};

export const uploadReport = async (req, res, next) => {
  try {
    const result = await ReportIngestionService.ingestFile({
      file: req.file,
      metadata: req.body,
      user: req.user,
    });
    return sendSuccess(res, result, `Successfully ingested ${result.count} report(s)`, 201);
  } catch (error) {
    next(error);
  }
};

export const getReports = async (req, res, next) => {
  try {
    const result = await ReportIngestionService.getReports(req.query);
    return sendSuccess(res, result.reports, "Safety reports retrieved successfully", 200, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const getReportById = async (req, res, next) => {
  try {
    const report = await ReportIngestionService.getReportById(req.params.id);
    return sendSuccess(res, report, "Safety report retrieved successfully", 200);
  } catch (error) {
    next(error);
  }
};

export const updateReport = async (req, res, next) => {
  try {
    const report = await ReportIngestionService.updateReport(req.params.id, req.body, req.user);
    return sendSuccess(res, report, "Safety report updated successfully", 200);
  } catch (error) {
    next(error);
  }
};

export const deleteReport = async (req, res, next) => {
  try {
    const result = await ReportIngestionService.deleteReport(req.params.id, req.user);
    return sendSuccess(res, result, "Safety report deleted successfully", 200);
  } catch (error) {
    next(error);
  }
};

export default {
  createReport,
  uploadReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport,
};
