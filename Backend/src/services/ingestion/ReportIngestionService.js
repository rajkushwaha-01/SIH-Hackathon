import path from "path";
import mongoose from "mongoose";
import { SafetyReport } from "../../models/SafetyReport.js";
import { TextParser } from "./TextParser.js";
import { PdfParser } from "./PdfParser.js";
import { CsvParser } from "./CsvParser.js";
import { NormalizationService } from "./NormalizationService.js";
import { DuplicateDetectionService } from "./DuplicateDetectionService.js";
import { generateReportId } from "../../utils/hash.js";
import { AppError } from "../../utils/appError.js";
import { logger } from "../../utils/logger.js";

export class ReportIngestionService {
  /**
   * Ingest a single manual structured or plain text safety report.
   */
  static async createReport(inputData, user = null) {
    const rawText = inputData.rawText || inputData.description || "";
    if (!rawText.trim()) {
      throw new AppError("Safety report content or description is required", 400, "EMPTY_REPORT_CONTENT");
    }

    const reportId = inputData.reportId?.trim() || generateReportId("INC");

    // Parse structured hints from text if present
    const parsedText = TextParser.parse(rawText);

    // Merge manual inputs over parsed hints
    const combinedRaw = {
      ...parsedText,
      ...inputData,
      description: inputData.description || parsedText.description || rawText,
    };

    // Normalize into canonical schema
    const normalizedReport = NormalizationService.normalize(combinedRaw);

    // Check for exact duplicate reportId or content hash
    const duplicateCheck = await DuplicateDetectionService.checkDuplicate({
      reportId,
      content: rawText,
    });

    const report = new SafetyReport({
      reportId,
      sourceType: inputData.sourceType || "TEXT",
      originalFileName: inputData.originalFileName || null,
      originalContent: rawText,
      contentHash: duplicateCheck.contentHash,
      normalizedReport,
      status: "INGESTED",
      isDuplicate: duplicateCheck.isDuplicate,
      duplicateOf: duplicateCheck.duplicateOf,
      duplicateType: duplicateCheck.duplicateType,
      vectorStatus: "PENDING",
      createdBy: user?._id || null,
    });

    if (mongoose.connection.readyState === 1) {
      await report.save();
    }
    logger.info(`Safety report created: ${report.reportId} [isDuplicate: ${report.isDuplicate}]`);

    return report;
  }

  /**
   * Ingest uploaded file (PDF, CSV, or TXT).
   */
  static async ingestFile({ file, metadata = {}, user = null }) {
    if (!file || !file.buffer) {
      throw new AppError("No file uploaded or file buffer is empty", 400, "MISSING_FILE");
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const createdReports = [];

    if (ext === ".pdf") {
      const parsedPdf = await PdfParser.parse(file.buffer, file.originalname);
      const combined = { ...parsedPdf, ...metadata };
      const report = await ReportIngestionService.createReport(
        {
          ...combined,
          sourceType: "PDF",
          originalFileName: file.originalname,
          rawText: parsedPdf.rawText,
        },
        user
      );
      createdReports.push(report);
    } else if (ext === ".csv") {
      const parsedRows = CsvParser.parse(file.buffer, file.originalname);
      for (const row of parsedRows) {
        const combined = { ...row, ...metadata };
        const report = await ReportIngestionService.createReport(
          {
            ...combined,
            sourceType: "CSV",
            originalFileName: file.originalname,
            rawText: row.rawText || row.description,
          },
          user
        );
        createdReports.push(report);
      }
    } else if (ext === ".txt") {
      const textContent = file.buffer.toString("utf-8");
      const parsedTxt = TextParser.parse(textContent);
      const combined = { ...parsedTxt, ...metadata };
      const report = await ReportIngestionService.createReport(
        {
          ...combined,
          sourceType: "TXT",
          originalFileName: file.originalname,
          rawText: textContent,
        },
        user
      );
      createdReports.push(report);
    } else {
      throw new AppError(`Unsupported file format: ${ext}`, 400, "UNSUPPORTED_FORMAT");
    }

    return {
      count: createdReports.length,
      reports: createdReports,
    };
  }

  /**
   * Query safety reports with multi-criteria filtering, search, and pagination.
   */
  static async getReports(queryParams = {}) {
    if (mongoose.connection.readyState !== 1) {
      return {
        reports: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 1, hasNextPage: false, hasPrevPage: false },
      };
    }

    const {
      site,
      activity,
      location,
      reportType,
      status,
      isDuplicate,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = queryParams;

    const filter = {};

    if (site) filter["normalizedReport.site"] = new RegExp(`^${site}$`, "i");
    if (activity) filter["normalizedReport.activity"] = new RegExp(activity, "i");
    if (location) filter["normalizedReport.location"] = new RegExp(location, "i");
    if (reportType) filter["normalizedReport.reportType"] = reportType.toUpperCase();
    if (status) filter.status = status.toUpperCase();
    if (typeof isDuplicate === "boolean") filter.isDuplicate = isDuplicate;

    if (startDate || endDate) {
      filter["normalizedReport.eventDate"] = {};
      if (startDate) filter["normalizedReport.eventDate"].$gte = new Date(startDate);
      if (endDate) filter["normalizedReport.eventDate"].$lte = new Date(endDate);
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      filter.$or = [
        { reportId: searchRegex },
        { "normalizedReport.title": searchRegex },
        { "normalizedReport.description": searchRegex },
        { "normalizedReport.site": searchRegex },
        { "normalizedReport.activity": searchRegex },
      ];
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [reports, total] = await Promise.all([
      SafetyReport.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "name email role"),
      SafetyReport.countDocuments(filter),
    ]);

    return {
      reports,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Get single report by reportId or ObjectId.
   */
  static async getReportById(id) {
    if (mongoose.connection.readyState !== 1) {
      throw new AppError("Database is offline. Cannot retrieve report.", 503, "DATABASE_DISCONNECTED");
    }

    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { $or: [{ _id: id }, { reportId: id }] } : { reportId: id };

    const report = await SafetyReport.findOne(query).populate("createdBy", "name email role");

    if (!report) {
      throw new AppError(`Safety report '${id}' was not found`, 404, "REPORT_NOT_FOUND");
    }

    return report;
  }

  /**
   * Update report fields.
   */
  static async updateReport(id, updateData, user = null) {
    const report = await ReportIngestionService.getReportById(id);

    if (updateData.title) report.normalizedReport.title = updateData.title;
    if (updateData.reportType) report.normalizedReport.reportType = updateData.reportType;
    if (updateData.eventDate) report.normalizedReport.eventDate = new Date(updateData.eventDate);
    if (updateData.site) report.normalizedReport.site = updateData.site;
    if (updateData.facility) report.normalizedReport.facility = updateData.facility;
    if (updateData.location) report.normalizedReport.location = updateData.location;
    if (updateData.department) report.normalizedReport.department = updateData.department;
    if (updateData.activity) report.normalizedReport.activity = updateData.activity;
    if (updateData.equipment) report.normalizedReport.equipment = updateData.equipment;
    if (updateData.description) report.normalizedReport.description = updateData.description;

    if (updateData.actualOutcome) {
      if (updateData.actualOutcome.injurySeverity) {
        report.normalizedReport.actualOutcome.injurySeverity = updateData.actualOutcome.injurySeverity;
      }
      if (updateData.actualOutcome.damageSeverity) {
        report.normalizedReport.actualOutcome.damageSeverity = updateData.actualOutcome.damageSeverity;
      }
      if (updateData.actualOutcome.description) {
        report.normalizedReport.actualOutcome.description = updateData.actualOutcome.description;
      }
    }

    if (mongoose.connection.readyState === 1) {
      await report.save();
    }
    logger.info(`Safety report updated: ${report.reportId} by user ${user?.email || "system"}`);

    return report;
  }

  /**
   * Delete report.
   */
  static async deleteReport(id, user = null) {
    const report = await ReportIngestionService.getReportById(id);
    if (mongoose.connection.readyState === 1) {
      await SafetyReport.deleteOne({ _id: report._id });
    }
    logger.info(`Safety report deleted: ${report.reportId} by user ${user?.email || "system"}`);
    return { reportId: report.reportId, deleted: true };
  }
}

export default ReportIngestionService;
