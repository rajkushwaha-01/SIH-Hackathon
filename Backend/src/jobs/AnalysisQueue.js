import { AnalysisJob } from "../models/AnalysisJob.js";
import { SafetyReport } from "../models/SafetyReport.js";
import { ExtractionService } from "../services/nlp/ExtractionService.js";
import { VectorSearchService } from "../services/vector/VectorSearchService.js";
import { AppError } from "../utils/appError.js";
import { logger } from "../utils/logger.js";

export class AnalysisQueue {
  /**
   * Enqueue a new analysis job for a safety report.
   */
  static async enqueueJob(reportId) {
    const report = await SafetyReport.findOne({ reportId });
    if (!report) {
      throw new AppError(`Cannot analyze non-existent report '${reportId}'`, 404, "REPORT_NOT_FOUND");
    }

    const jobId = `JOB-${reportId}-${Date.now().toString().slice(-4)}`;

    const job = new AnalysisJob({
      jobId,
      reportId: report.reportId,
      status: "QUEUED",
      steps: {
        ingestion: "COMPLETED",
        normalization: "COMPLETED",
        nlp: "PENDING",
        sif: "PENDING",
        precursor: "PENDING",
        riskScoring: "PENDING",
        embedding: "PENDING",
        vectorIndex: "PENDING",
      },
      currentStep: "nlp",
      startedAt: new Date(),
    });

    await job.save();
    logger.info(`Enqueued analysis job: ${job.jobId} for report ${reportId}`);

    // Trigger asynchronous execution in the background
    setImmediate(() => {
      AnalysisQueue.processJob(job.jobId).catch((err) => {
        logger.error(`Unhandled error processing job ${job.jobId}:`, err);
      });
    });

    return job;
  }

  /**
   * Execute pipeline steps for an analysis job.
   */
  static async processJob(jobId) {
    const job = await AnalysisJob.findOne({ jobId });
    if (!job) {
      logger.error(`Job ${jobId} not found for processing`);
      return null;
    }

    try {
      job.status = "PROCESSING";
      job.steps.nlp = "PROCESSING";
      job.currentStep = "nlp";
      await job.save();

      // Step 1: Run NLP Extraction, SIF, Precursors, LSR & Risk Engine
      const extractionResult = await ExtractionService.extractAndPersist(job.reportId);

      job.steps.nlp = "COMPLETED";
      job.steps.sif = "COMPLETED";
      job.steps.precursor = "COMPLETED";
      job.steps.riskScoring = "COMPLETED";
      job.steps.embedding = "PROCESSING";
      job.steps.vectorIndex = "PROCESSING";
      job.currentStep = "vectorIndex";
      await job.save();

      // Step 2: Run Vector Chunking, Embeddings & Pinecone Indexing
      const report = await SafetyReport.findOne({ reportId: job.reportId });
      if (report) {
        await VectorSearchService.indexReportVectors(report, extractionResult.analysis);
      }

      job.steps.embedding = "COMPLETED";
      job.steps.vectorIndex = "COMPLETED";
      job.status = "COMPLETED";
      job.completedAt = new Date();
      await job.save();

      logger.info(`Analysis job completed successfully: ${job.jobId}`);
      return { job, result: extractionResult };
    } catch (error) {
      logger.error(`Analysis job ${job.jobId} failed at step ${job.currentStep}:`, error);

      job.attempts += 1;
      job.error = {
        step: job.currentStep,
        message: error.message,
        stack: error.stack,
      };

      if (job.attempts < job.maxAttempts) {
        job.status = "RETRYING";
        await job.save();
        logger.info(`Retrying job ${job.jobId} (Attempt ${job.attempts + 1}/${job.maxAttempts})...`);
        setTimeout(() => AnalysisQueue.processJob(jobId), 2000);
      } else {
        job.status = "FAILED";
        job.steps[job.currentStep] = "FAILED";
        await job.save();
      }

      return { job, error };
    }
  }

  /**
   * Get current status of an analysis job.
   */
  static async getJobStatus(jobId) {
    const job = await AnalysisJob.findOne({ jobId });
    if (!job) {
      throw new AppError(`Analysis job '${jobId}' was not found`, 404, "JOB_NOT_FOUND");
    }
    return job;
  }
}

export default AnalysisQueue;
