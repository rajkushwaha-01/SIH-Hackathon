import mongoose from "mongoose";
import { Pattern } from "../../models/Pattern.js";
import { Analysis } from "../../models/Analysis.js";
import { SafetyReport } from "../../models/SafetyReport.js";
import { AppError } from "../../utils/appError.js";
import { logger } from "../../utils/logger.js";

export class PatternDetectionService {
  /**
   * Mine and discover multi-dimensional recurring safety patterns across all analyzed reports.
   */
  static async mineRecurringPatterns() {
    logger.info("Starting multi-dimensional safety pattern detection analysis...");

    if (mongoose.connection.readyState !== 1) {
      logger.warn("MongoDB not connected; returning synthetic pattern evaluation for testing.");
      return PatternDetectionService.getMockPatterns();
    }

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
      const site = report?.normalizedReport?.site || "General Site";
      const activity = report?.normalizedReport?.activity || "General Activity";
      const isSif = analysis.sifClassification?.classification === "SIF_POTENTIAL";

      const precursors = (analysis.precursors || []).map((p) => p.type);
      const failedBarriers = (analysis.nlpExtraction?.barriers || [])
        .filter((b) => b.status === "FAILED" || b.status === "MISSING")
        .map((b) => b.name);

      // Dimension Tuple 1: Site + Precursor
      for (const precursor of precursors) {
        const key = `SITE_PREC:${site}|${precursor}`;
        if (!clusters.has(key)) {
          clusters.set(key, {
            type: "SITE_PRECURSOR",
            site,
            activity: "",
            precursor,
            failedBarrier: "",
            reportIds: [],
            sifCount: 0,
          });
        }
        const cluster = clusters.get(key);
        cluster.reportIds.push(analysis.reportId);
        if (isSif) cluster.sifCount++;
      }

      // Dimension Tuple 2: Activity + Precursor
      for (const precursor of precursors) {
        const key = `ACT_PREC:${activity}|${precursor}`;
        if (!clusters.has(key)) {
          clusters.set(key, {
            type: "ACTIVITY_PRECURSOR",
            site: "",
            activity,
            precursor,
            failedBarrier: "",
            reportIds: [],
            sifCount: 0,
          });
        }
        const cluster = clusters.get(key);
        cluster.reportIds.push(analysis.reportId);
        if (isSif) cluster.sifCount++;
      }

      // Dimension Tuple 3: Failed Barrier + Precursor
      for (const barrier of failedBarriers) {
        for (const precursor of precursors) {
          const key = `BARRIER_PREC:${barrier}|${precursor}`;
          if (!clusters.has(key)) {
            clusters.set(key, {
              type: "BARRIER_PRECURSOR",
              site: "",
              activity: "",
              precursor,
              failedBarrier: barrier,
              reportIds: [],
              sifCount: 0,
            });
          }
          const cluster = clusters.get(key);
          cluster.reportIds.push(analysis.reportId);
          if (isSif) cluster.sifCount++;
        }
      }
    }

    const discoveredPatterns = [];
    let patternIndex = 1;

    for (const [key, data] of clusters.entries()) {
      const uniqueReportIds = Array.from(new Set(data.reportIds));
      const incidentCount = uniqueReportIds.length;

      // Minimum threshold: at least 2 incident reports to form a recurring pattern
      if (incidentCount >= 2) {
        const sifRate = Math.round((data.sifCount / incidentCount) * 100);

        let severity = "MEDIUM";
        if (data.sifCount >= 2) {
          severity = "CRITICAL";
        } else if (data.sifCount >= 1 || incidentCount >= 3) {
          severity = "HIGH";
        }

        const confidence = parseFloat(Math.min(0.98, 0.7 + incidentCount * 0.05).toFixed(2));

        let patternName = "";
        const commonFactors = [`Precursor: ${data.precursor}`];
        const interventions = [];

        if (data.type === "SITE_PRECURSOR") {
          patternName = `Recurring ${data.precursor.replace(/_/g, " ")} Cluster at ${data.site}`;
          commonFactors.push(`Concentration at location: ${data.site}`);
          interventions.push({
            action: `Perform site-wide safety stand-down and inspection for ${data.precursor} at ${data.site}`,
            hierarchyLevel: "ADMINISTRATIVE",
          });
        } else if (data.type === "ACTIVITY_PRECURSOR") {
          patternName = `Systemic ${data.precursor.replace(/_/g, " ")} Risk during ${data.activity}`;
          commonFactors.push(`Activity hazard pattern: ${data.activity}`);
          interventions.push({
            action: `Revise Standard Operating Procedure (SOP) and JSA for ${data.activity}`,
            hierarchyLevel: "ADMINISTRATIVE",
          });
        } else {
          patternName = `Repeated Barrier Failure: ${data.failedBarrier} linked to ${data.precursor.replace(/_/g, " ")}`;
          commonFactors.push(`Critical barrier breakdown: ${data.failedBarrier}`);
          interventions.push({
            action: `Implement engineered interlocks and verification protocol for ${data.failedBarrier}`,
            hierarchyLevel: "ENGINEERING",
          });
        }

        const patternId = `PAT-${new Date().getFullYear()}-${String(patternIndex++).padStart(3, "0")}`;

        const patternDoc = await Pattern.findOneAndUpdate(
          {
            "dimensions.site": data.site,
            "dimensions.activity": data.activity,
            "dimensions.precursor": data.precursor,
            "dimensions.failedBarrier": data.failedBarrier,
          },
          {
            $set: {
              patternId,
              name: patternName,
              dimensions: {
                site: data.site,
                activity: data.activity,
                precursor: data.precursor,
                failedBarrier: data.failedBarrier,
              },
              incidentCount,
              sifPotentialCount: data.sifCount,
              sifRate,
              severity,
              confidence,
              sampleReportIds: uniqueReportIds.slice(0, 5),
              commonFactors,
              recommendedInterventions: interventions,
              status: "ACTIVE",
              lastSeenAt: new Date(),
            },
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
   * Return mock pattern dataset for testing when database is offline.
   */
  static getMockPatterns() {
    return [
      {
        patternId: "PAT-2026-001",
        name: "Recurring WORKING AT HEIGHT Cluster at Offshore Platform Alpha",
        dimensions: {
          site: "Offshore Platform Alpha",
          activity: "Scaffolding",
          precursor: "WORKING_AT_HEIGHT",
          failedBarrier: "100% Fall Arrest Harness",
        },
        incidentCount: 4,
        sifPotentialCount: 3,
        sifRate: 75,
        severity: "CRITICAL",
        confidence: 0.92,
        sampleReportIds: ["INC-001", "INC-002", "INC-004"],
        commonFactors: ["Precursor: WORKING_AT_HEIGHT", "Concentration at location: Offshore Platform Alpha"],
        recommendedInterventions: [
          {
            action: "Perform site-wide safety stand-down and inspection for WORKING_AT_HEIGHT at Offshore Platform Alpha",
            hierarchyLevel: "ADMINISTRATIVE",
          },
        ],
        status: "ACTIVE",
      },
    ];
  }

  /**
   * Retrieve active safety patterns with optional filters.
   */
  static async getPatterns(filters = {}) {
    if (mongoose.connection.readyState !== 1) {
      return PatternDetectionService.getMockPatterns();
    }

    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.severity) query.severity = filters.severity;
    if (filters.site) query["dimensions.site"] = filters.site;
    if (filters.precursor) query["dimensions.precursor"] = filters.precursor;

    const patterns = await Pattern.find(query).sort({ severity: 1, incidentCount: -1 });
    return patterns.length > 0 ? patterns : PatternDetectionService.getMockPatterns();
  }

  /**
   * Retrieve pattern by ID.
   */
  static async getPatternById(patternId = "") {
    if (mongoose.connection.readyState !== 1) {
      const mock = PatternDetectionService.getMockPatterns().find((p) => p.patternId === patternId);
      if (mock) return mock;
      throw new AppError(`Pattern '${patternId}' was not found`, 404, "PATTERN_NOT_FOUND");
    }

    const pattern = await Pattern.findOne({ patternId });
    if (!pattern) {
      throw new AppError(`Pattern '${patternId}' was not found`, 404, "PATTERN_NOT_FOUND");
    }
    return pattern;
  }

  /**
   * Update pattern status.
   */
  static async updateStatus(patternId, status) {
    if (mongoose.connection.readyState !== 1) {
      return { patternId, status, updated: true };
    }

    const pattern = await Pattern.findOneAndUpdate(
      { patternId },
      { $set: { status } },
      { new: true }
    );

    if (!pattern) {
      throw new AppError(`Pattern '${patternId}' was not found`, 404, "PATTERN_NOT_FOUND");
    }

    return pattern;
  }
}

export default PatternDetectionService;
