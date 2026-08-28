import mongoose from "mongoose";
import { Pattern } from "../../models/Pattern.js";
import { Analysis } from "../../models/Analysis.js";
import { SafetyReport } from "../../models/SafetyReport.js";
import { AppError } from "../../utils/appError.js";
import { logger } from "../../utils/logger.js";

export class PatternDetectionService {
  /**
   * Check if MongoDB is connected; throw error if offline (Rule 20: No Silent Fallback).
   */
  static verifyDbConnection() {
    if (mongoose.connection.readyState !== 1) {
      throw new AppError(
        "Database is offline or disconnected. Cannot perform pattern mining.",
        503,
        "DATABASE_DISCONNECTED"
      );
    }
  }

  /**
   * Mine and discover multi-dimensional recurring safety patterns across all analyzed reports.
   */
  static async mineRecurringPatterns() {
    PatternDetectionService.verifyDbConnection();
    logger.info("Starting multi-dimensional safety pattern detection analysis from MongoDB...");

    const latestAnalyses = await Analysis.find({ isLatest: true });
    if (!latestAnalyses || latestAnalyses.length === 0) {
      return [];
    }

    // Hydrate report metadata for site and activity
    const reportMap = new Map();
    const reports = await SafetyReport.find({
      reportId: { $in: latestAnalyses.map((a) => a.reportId) },
    });
    for (const rep of reports) {
      reportMap.set(rep.reportId, rep);
    }

    // Grouping clusters map: key = dimensionKey -> { reports: [], sifs: 0, precursors: Set, barriers: Set }
    const clusters = new Map();

    for (const analysis of latestAnalyses) {
      const report = reportMap.get(analysis.reportId);
      const site = report?.normalizedReport?.site || "All Sites";
      const activity = report?.normalizedReport?.activity || analysis.nlpExtraction?.activity || "General Operations";
      const precursors = analysis.precursors?.map((p) => p.type) || [];
      const failedBarriers =
        analysis.nlpExtraction?.barriers
          ?.filter((b) => b.status === "FAILED" || b.status === "MISSING")
          ?.map((b) => b.name) || [];

      // 1. Cluster by Site + Activity + Precursor
      for (const prec of precursors) {
        const key = `${site}::${activity}::${prec}`;
        if (!clusters.has(key)) {
          clusters.set(key, {
            type: "SITE_ACTIVITY_PRECURSOR",
            site,
            activity,
            precursor: prec,
            barrier: failedBarriers[0] || null,
            reportIds: [],
            sifCount: 0,
            analyses: [],
          });
        }
        const cluster = clusters.get(key);
        cluster.reportIds.push(analysis.reportId);
        cluster.analyses.push(analysis);
        if (analysis.sifClassification?.classification === "SIF_POTENTIAL") {
          cluster.sifCount++;
        }
      }

      // 2. Cluster by Precursor + Failed Barrier across all sites
      for (const prec of precursors) {
        for (const barrier of failedBarriers) {
          const key = `SYSTEMIC::${prec}::${barrier}`;
          if (!clusters.has(key)) {
            clusters.set(key, {
              type: "SYSTEMIC_BARRIER_FAILURE",
              site: "Multiple Sites",
              activity: "Cross-Functional",
              precursor: prec,
              barrier,
              reportIds: [],
              sifCount: 0,
              analyses: [],
            });
          }
          const cluster = clusters.get(key);
          if (!cluster.reportIds.includes(analysis.reportId)) {
            cluster.reportIds.push(analysis.reportId);
            cluster.analyses.push(analysis);
            if (analysis.sifClassification?.classification === "SIF_POTENTIAL") {
              cluster.sifCount++;
            }
          }
        }
      }
    }

    const discoveredPatterns = [];

    // Filter clusters with >= 2 occurrences to establish recurrence pattern
    for (const [key, cluster] of clusters.entries()) {
      if (cluster.reportIds.length >= 2) {
        const incidentCount = cluster.reportIds.length;
        const sifRate = Math.round((cluster.sifCount / incidentCount) * 100);

        let severity = "LOW";
        if (sifRate >= 70 || cluster.sifCount >= 3) severity = "CRITICAL";
        else if (sifRate >= 40 || cluster.sifCount >= 2) severity = "HIGH";
        else if (sifRate >= 20 || incidentCount >= 3) severity = "MEDIUM";

        const confidence = parseFloat((0.75 + Math.min(0.2, (incidentCount - 2) * 0.05) + (sifRate > 50 ? 0.04 : 0)).toFixed(2));

        const commonFactors = [
          `Precursor: ${cluster.precursor}`,
          cluster.barrier ? `Recurring Failed Barrier: ${cluster.barrier}` : null,
          cluster.site !== "Multiple Sites" ? `Concentration at location: ${cluster.site}` : "Systemic multi-site occurrence",
          cluster.activity !== "Cross-Functional" ? `High frequency during: ${cluster.activity}` : null,
        ].filter(Boolean);

        const recommendedInterventions = [];
        if (cluster.barrier) {
          recommendedInterventions.push({
            action: `Initiate mandatory engineering barrier audit and verification protocol for '${cluster.barrier}' across all ${cluster.activity} permits.`,
            hierarchyLevel: "ENGINEERING",
          });
        }
        if (cluster.site !== "Multiple Sites") {
          recommendedInterventions.push({
            action: `Perform site-wide safety stand-down and inspection for ${cluster.precursor} at ${cluster.site}.`,
            hierarchyLevel: "ADMINISTRATIVE",
          });
        } else {
          recommendedInterventions.push({
            action: `Issue enterprise safety advisory across all business units for recurring ${cluster.precursor} exposures.`,
            hierarchyLevel: "PROCEDURAL",
          });
        }

        const patternId = `PAT-${new Date().getFullYear()}-${discoveredPatterns.length + 1}`;
        const name =
          cluster.type === "SYSTEMIC_BARRIER_FAILURE"
            ? `Systemic ${cluster.precursor.replace(/_/g, " ")} & ${cluster.barrier} Degradation`
            : `Recurring ${cluster.precursor.replace(/_/g, " ")} Cluster at ${cluster.site}`;

        const patternDoc = await Pattern.findOneAndUpdate(
          {
            "dimensions.site": cluster.site,
            "dimensions.precursor": cluster.precursor,
            "dimensions.failedBarrier": cluster.barrier,
          },
          {
            patternId,
            name,
            description: `Identified ${incidentCount} correlated incidents involving ${cluster.precursor} with ${sifRate}% SIF potential rate.`,
            dimensions: {
              site: cluster.site,
              activity: cluster.activity,
              precursor: cluster.precursor,
              failedBarrier: cluster.barrier,
            },
            incidentCount,
            sifPotentialCount: cluster.sifCount,
            sifRate,
            severity,
            confidence,
            sampleReportIds: cluster.reportIds.slice(0, 5),
            commonFactors,
            recommendedInterventions,
            status: "ACTIVE",
            firstDetectedAt: new Date(),
            lastUpdatedAt: new Date(),
          },
          { upsert: true, new: true }
        );

        discoveredPatterns.push(patternDoc);
      }
    }

    logger.info(`Pattern mining complete: Discovered ${discoveredPatterns.length} recurring safety patterns.`);
    return discoveredPatterns;
  }

  /**
   * Retrieve active safety patterns with optional filters from MongoDB.
   */
  static async getPatterns(filters = {}) {
    PatternDetectionService.verifyDbConnection();

    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.severity) query.severity = filters.severity;
    if (filters.site) query["dimensions.site"] = filters.site;
    if (filters.precursor) query["dimensions.precursor"] = filters.precursor;

    return Pattern.find(query).sort({ severity: 1, incidentCount: -1 });
  }

  /**
   * Retrieve pattern by ID from MongoDB.
   */
  static async getPatternById(patternId = "") {
    PatternDetectionService.verifyDbConnection();

    const pattern = await Pattern.findOne({ patternId });
    if (!pattern) {
      throw new AppError(`Pattern '${patternId}' was not found in database`, 404, "PATTERN_NOT_FOUND");
    }
    return pattern;
  }

  /**
   * Update pattern status in MongoDB.
   */
  static async updateStatus(patternId, status) {
    PatternDetectionService.verifyDbConnection();

    const pattern = await Pattern.findOneAndUpdate(
      { patternId },
      { $set: { status } },
      { new: true }
    );

    if (!pattern) {
      throw new AppError(`Pattern '${patternId}' was not found in database`, 404, "PATTERN_NOT_FOUND");
    }

    return pattern;
  }
}

export default PatternDetectionService;
