import mongoose from "mongoose";
import { DocumentChunk } from "../../models/DocumentChunk.js";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

export class ChunkingService {
  /**
   * Approximate token count estimator (1 token ~= 4 characters).
   */
  static estimateTokenCount(text = "") {
    return Math.ceil((text || "").length / 4);
  }

  /**
   * Split narrative text into overlapping semantic chunks.
   */
  static splitTextIntoSegments(text = "", maxChunkLength = 500, overlap = 80) {
    if (!text || typeof text !== "string") return [];

    const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    const segments = [];

    for (const para of paragraphs) {
      if (para.length <= maxChunkLength) {
        segments.push(para);
      } else {
        // Sliding window splitting for long paragraphs
        let start = 0;
        while (start < para.length) {
          const end = Math.min(start + maxChunkLength, para.length);
          const chunkStr = para.substring(start, end).trim();
          if (chunkStr.length > 20) {
            segments.push(chunkStr);
          }
          if (end >= para.length) break;
          start += maxChunkLength - overlap;
        }
      }
    }

    // If no paragraphs split, use raw text
    return segments.length > 0 ? segments : [text.trim()];
  }

  /**
   * Create and persist DocumentChunk entities for a report and its analysis.
   */
  static async createChunks(report, analysis = null) {
    const rawText = report.originalContent || report.normalizedReport?.description || "";
    const segments = ChunkingService.splitTextIntoSegments(rawText, 500, 80);

    const chunkDocuments = [];

    // Remove any existing chunks for this reportId
    if (mongoose.connection.readyState === 1) {
      await DocumentChunk.deleteMany({ reportId: report.reportId });
    }

    for (let index = 0; index < segments.length; index++) {
      const segmentText = segments[index];
      const chunkId = `chunk_${report.reportId}_${String(index + 1).padStart(3, "0")}`;

      const metadata = {
        site: report.normalizedReport?.site || "Main Site",
        activity: report.normalizedReport?.activity || "General Activity",
        location: report.normalizedReport?.location || "General Area",
        reportType: report.normalizedReport?.reportType || "OBSERVATION",
        sifStatus: analysis?.sifClassification?.classification || "NON_SIF",
        precursors: analysis?.precursors?.map((p) => p.type) || [],
        hazards: analysis?.nlpExtraction?.hazards?.map((h) => h.name) || [],
        riskScore: analysis?.riskScore?.score || 0,
        eventDate: report.normalizedReport?.eventDate || new Date(),
        sourceType: report.sourceType || "TEXT",
        textSnippet: segmentText.substring(0, 180),
      };

      const docChunk = new DocumentChunk({
        chunkId,
        reportId: report.reportId,
        chunkIndex: index,
        content: segmentText,
        tokenCount: ChunkingService.estimateTokenCount(segmentText),
        metadata,
        embeddingModel: env.EMBEDDING_MODEL || "gemini-embedding-001",
        embeddingDimension: 768,
        isIndexedInPinecone: false,
      });

      if (mongoose.connection.readyState === 1) {
        await docChunk.save();
      }

      chunkDocuments.push(docChunk);
    }

    logger.info(`Generated ${chunkDocuments.length} document chunks for report ${report.reportId}`);
    return chunkDocuments;
  }
}

export default ChunkingService;
