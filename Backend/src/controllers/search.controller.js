import mongoose from "mongoose";
import { VectorSearchService } from "../services/vector/VectorSearchService.js";
import { SafetyReport } from "../models/SafetyReport.js";
import { AppError } from "../utils/appError.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const semanticSearch = async (req, res, next) => {
  try {
    const query = req.body?.query || req.query?.query || req.query?.q;
    const topK = req.body?.topK || req.query?.topK || 5;
    const minScore = req.body?.minScore || req.query?.minScore || 0.4;
    const filters = req.body?.filters || {};

    if (!query || typeof query !== "string" || !query.trim()) {
      throw new AppError("Search query string is required", 400, "INVALID_QUERY");
    }

    const matches = await VectorSearchService.searchSimilar({
      queryText: query,
      topK: Math.min(20, Math.max(1, parseInt(topK, 10) || 5)),
      filter: Object.keys(filters).length > 0 ? filters : null,
      minScore: parseFloat(minScore) || 0.4,
    });

    return sendSuccess(
      res,
      {
        query,
        count: matches.length,
        results: matches,
      },
      "Semantic similarity search completed",
      200
    );
  } catch (error) {
    next(error);
  }
};

export const getSimilarReports = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { topK = 5, minScore = 0.4 } = req.query;

    let report = null;
    if (mongoose.connection.readyState === 1) {
      const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
      const query = isObjectId ? { $or: [{ _id: id }, { reportId: id }] } : { reportId: id };
      report = await SafetyReport.findOne(query);
    }

    if (!report) {
      throw new AppError(`Report '${id}' not found`, 404, "REPORT_NOT_FOUND");
    }

    const queryText = report.originalContent || report.normalizedReport?.description || "";
    const matches = await VectorSearchService.searchSimilar({
      queryText,
      topK: Math.min(20, Math.max(1, parseInt(topK, 10) || 5)),
      excludeReportId: report.reportId,
      minScore: parseFloat(minScore) || 0.4,
    });

    return sendSuccess(
      res,
      {
        targetReportId: report.reportId,
        count: matches.length,
        similarIncidents: matches,
      },
      `Similar historical incidents for report ${id}`,
      200
    );
  } catch (error) {
    next(error);
  }
};

export default {
  semanticSearch,
  getSimilarReports,
};
