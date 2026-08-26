import mongoose from "mongoose";
import { SafetyReport } from "../../models/SafetyReport.js";
import { DocumentChunk } from "../../models/DocumentChunk.js";
import { ChunkingService } from "../nlp/ChunkingService.js";
import { EmbeddingService } from "../embeddings/EmbeddingService.js";
import { PineconeService } from "./PineconeService.js";
import { AppError } from "../../utils/appError.js";
import { logger } from "../../utils/logger.js";

export class VectorSearchService {
  /**
   * Chunks a safety report, computes embeddings, and indexes them into Pinecone.
   */
  static async indexReportVectors(report, analysis = null) {
    logger.info(`Starting vector indexing for report: ${report.reportId}`);

    try {
      // 1. Generate DocumentChunks
      const chunks = await ChunkingService.createChunks(report, analysis);
      if (chunks.length === 0) {
        logger.warn(`No chunks generated for report ${report.reportId}`);
        return { count: 0, status: "NO_CHUNKS" };
      }

      // 2. Generate embeddings for all chunks
      const vectorRecords = [];
      for (const chunk of chunks) {
        const { embedding } = await EmbeddingService.generateEmbedding(chunk.content);
        vectorRecords.push({
          id: chunk.chunkId,
          values: embedding,
          metadata: {
            reportId: chunk.reportId,
            chunkId: chunk.chunkId,
            site: chunk.metadata.site,
            activity: chunk.metadata.activity,
            location: chunk.metadata.location,
            reportType: chunk.metadata.reportType,
            sifStatus: chunk.metadata.sifStatus,
            precursors: chunk.metadata.precursors || [],
            hazards: chunk.metadata.hazards || [],
            riskScore: chunk.metadata.riskScore || 0,
            textSnippet: chunk.metadata.textSnippet,
          },
        });
      }

      // 3. Upsert to Pinecone
      const upsertResult = await PineconeService.upsertVectors(vectorRecords);

      // 4. Update DocumentChunk indexing status in MongoDB
      if (mongoose.connection.readyState === 1) {
        await DocumentChunk.updateMany(
          { reportId: report.reportId },
          { $set: { isIndexedInPinecone: true, indexedAt: new Date() } }
        );

        // 5. Update SafetyReport vectorStatus
        await SafetyReport.updateOne(
          { reportId: report.reportId },
          { $set: { vectorStatus: "COMPLETED" } }
        );
      }

      logger.info(`Successfully indexed ${vectorRecords.length} vectors for report ${report.reportId}`);
      return { count: vectorRecords.length, status: "COMPLETED", upsertResult };
    } catch (error) {
      logger.error(`Vector indexing failed for report ${report.reportId}:`, error);
      if (mongoose.connection.readyState === 1) {
        await SafetyReport.updateOne(
          { reportId: report.reportId },
          { $set: { vectorStatus: "FAILED" } }
        );
      }
      return { count: 0, status: "FAILED", error: error.message };
    }
  }

  /**
   * Search for semantically similar chunks/incidents.
   */
  static async searchSimilar({
    queryText = "",
    topK = 5,
    filter = null,
    minScore = 0.5,
    excludeReportId = null,
  } = {}) {
    if (!queryText || !queryText.trim()) {
      throw new AppError("Search query text cannot be empty", 400, "EMPTY_SEARCH_QUERY");
    }

    // 1. Generate query vector
    const { embedding } = await EmbeddingService.generateEmbedding(queryText);

    // 2. Query Pinecone vector store
    const matches = await PineconeService.queryVectors({
      vector: embedding,
      topK: topK * 2, // Fetch more to allow for report deduplication
      filter,
    });

    // 3. Filter by minimum similarity score and exclude target reportId
    const filteredMatches = matches.filter((m) => {
      if (m.score < minScore) return false;
      if (excludeReportId && m.metadata?.reportId === excludeReportId) return false;
      return true;
    });

    // 4. Deduplicate by reportId (retain highest scoring chunk for each report)
    const reportMap = new Map();
    for (const match of filteredMatches) {
      const repId = match.metadata?.reportId;
      if (repId && !reportMap.has(repId)) {
        reportMap.set(repId, match);
      }
    }

    const uniqueMatches = Array.from(reportMap.values()).slice(0, topK);

    // 5. Hydrate canonical reports from MongoDB if available
    const hydratedResults = [];
    for (const match of uniqueMatches) {
      let canonicalReport = null;
      if (mongoose.connection.readyState === 1) {
        canonicalReport = await SafetyReport.findOne({ reportId: match.metadata.reportId });
      }

      hydratedResults.push({
        reportId: match.metadata.reportId,
        chunkId: match.id,
        similarityScore: match.score,
        matchingFactors: [
          match.metadata.activity,
          match.metadata.site,
          ...(match.metadata.precursors || []),
        ].filter(Boolean),
        textSnippet: match.metadata.textSnippet,
        reportDetails: canonicalReport
          ? {
              title: canonicalReport.normalizedReport.title,
              site: canonicalReport.normalizedReport.site,
              activity: canonicalReport.normalizedReport.activity,
              reportType: canonicalReport.normalizedReport.reportType,
              eventDate: canonicalReport.normalizedReport.eventDate,
            }
          : null,
      });
    }

    return hydratedResults;
  }
}

export default VectorSearchService;
