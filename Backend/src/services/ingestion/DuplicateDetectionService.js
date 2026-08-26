import mongoose from "mongoose";
import { SafetyReport } from "../../models/SafetyReport.js";
import { generateContentHash } from "../../utils/hash.js";
import { logger } from "../../utils/logger.js";

export class DuplicateDetectionService {
  /**
   * Check if a report with the same reportId or identical content hash already exists.
   */
  static async checkDuplicate({ reportId, content }) {
    const contentHash = generateContentHash(content);

    if (mongoose.connection.readyState !== 1) {
      return {
        isDuplicate: false,
        duplicateOf: null,
        duplicateType: null,
        contentHash,
      };
    }

    // 1. Check exact reportId collision
    if (reportId) {
      const existingById = await SafetyReport.findOne({ reportId });
      if (existingById) {
        logger.warn(`Duplicate detected: Exact reportId '${reportId}' already exists.`);
        return {
          isDuplicate: true,
          duplicateOf: existingById.reportId,
          duplicateType: "EXACT_ID",
          contentHash,
          originalReport: existingById,
        };
      }
    }

    // 2. Check exact content hash duplicate
    const existingByHash = await SafetyReport.findOne({ contentHash });
    if (existingByHash) {
      logger.warn(`Duplicate detected: Identical content hash matches existing report '${existingByHash.reportId}'.`);
      return {
        isDuplicate: true,
        duplicateOf: existingByHash.reportId,
        duplicateType: "CONTENT_HASH",
        contentHash,
        originalReport: existingByHash,
      };
    }

    // No exact duplicate found
    return {
      isDuplicate: false,
      duplicateOf: null,
      duplicateType: null,
      contentHash,
    };
  }
}

export default DuplicateDetectionService;
