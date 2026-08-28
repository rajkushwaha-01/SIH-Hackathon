import mongoose from "mongoose";
import { SafetyReport } from "../../models/SafetyReport.js";
import { Analysis } from "../../models/Analysis.js";
import { Pattern } from "../../models/Pattern.js";
import { BarrierService } from "../barrier/BarrierService.js";
import { AppError } from "../../utils/appError.js";
import { logger } from "../../utils/logger.js";

export class AnalyticsService {
  /**
   * Check if MongoDB is connected; throw meaningful error if offline (Rule 20: No Silent Fallback).
   */
  static verifyDbConnection() {
    if (mongoose.connection.readyState !== 1) {
      throw new AppError(
        "Database is offline or disconnected. Cannot query real safety analytics.",
        503,
        "DATABASE_DISCONNECTED"
      );
    }
  }

  /**
   * Retrieve high-level KPI cards computed dynamically from MongoDB.
   */
  static async getExecutiveKpis(filters = {}) {
    AnalyticsService.verifyDbConnection();

    const totalReports = await SafetyReport.countDocuments();
    const analyzedReports = await Analysis.countDocuments({ isLatest: true });

    const sifPotentialCount = await Analysis.countDocuments({
      isLatest: true,
      "sifClassification.classification": "SIF_POTENTIAL",
    });

    const criticalRiskCount = await Analysis.countDocuments({
      isLatest: true,
      "riskScore.level": "CRITICAL",
    });

    const highRiskCount = await Analysis.countDocuments({
      isLatest: true,
      "riskScore.level": "HIGH",
    });

    const activePatternsCount = await Pattern.countDocuments({ status: "ACTIVE" });

    const sifRate = analyzedReports > 0 ? Math.round((sifPotentialCount / analyzedReports) * 100) : 0;

    // Calculate dynamic barrier resilience from latest analyses
    const latestAnalyses = await Analysis.find({ isLatest: true });
    const allBarriers = [];
    for (const a of latestAnalyses) {
      if (a.nlpExtraction?.barriers) {
        allBarriers.push(...a.nlpExtraction.barriers);
      }
    }
    const resilience = BarrierService.calculateBarrierResilience(allBarriers);

    return {
      totalReports,
      analyzedReports,
      sifPotentialCount,
      sifRate,
      criticalRiskCount,
      highRiskCount,
      activePatternsCount,
      barrierHealthScore: resilience.score || (analyzedReports > 0 ? 0 : 100),
    };
  }

  /**
   * Retrieve breakdown by Site computed dynamically from MongoDB.
   */
  static async getBreakdownBySite() {
    AnalyticsService.verifyDbConnection();

    const analyses = await Analysis.find({ isLatest: true });
    if (!analyses || analyses.length === 0) return [];

    const reports = await SafetyReport.find({ reportId: { $in: analyses.map((a) => a.reportId) } });
    const reportMap = new Map();
    for (const r of reports) reportMap.set(r.reportId, r);

    const siteMap = new Map();

    for (const a of analyses) {
      const report = reportMap.get(a.reportId);
      const site = report?.normalizedReport?.site || "Unspecified Site";
      const isSif = a.sifClassification?.classification === "SIF_POTENTIAL";

      if (!siteMap.has(site)) {
        siteMap.set(site, { site, totalReports: 0, sifCount: 0, totalScore: 0 });
      }

      const entry = siteMap.get(site);
      entry.totalReports++;
      if (isSif) entry.sifCount++;
      entry.totalScore += a.riskScore?.score || 0;
    }

    return Array.from(siteMap.values())
      .map((s) => ({
        site: s.site,
        totalReports: s.totalReports,
        sifCount: s.sifCount,
        sifRate: s.totalReports > 0 ? Math.round((s.sifCount / s.totalReports) * 100) : 0,
        avgRiskScore: s.totalReports > 0 ? Math.round(s.totalScore / s.totalReports) : 0,
      }))
      .sort((a, b) => b.sifRate - a.sifRate);
  }

  /**
   * Retrieve breakdown by Precursor computed dynamically from MongoDB.
   */
  static async getBreakdownByPrecursor() {
    AnalyticsService.verifyDbConnection();

    const analyses = await Analysis.find({ isLatest: true });
    if (!analyses || analyses.length === 0) return [];

    const precMap = new Map();

    for (const a of analyses) {
      const isSif = a.sifClassification?.classification === "SIF_POTENTIAL";
      for (const p of a.precursors || []) {
        if (!precMap.has(p.type)) {
          precMap.set(p.type, { precursor: p.type, count: 0, sifCount: 0 });
        }
        const entry = precMap.get(p.type);
        entry.count++;
        if (isSif) entry.sifCount++;
      }
    }

    return Array.from(precMap.values())
      .map((p) => ({
        precursor: p.precursor,
        count: p.count,
        sifCount: p.sifCount,
        sifRate: p.count > 0 ? Math.round((p.sifCount / p.count) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Retrieve monthly/weekly trends over time computed dynamically from MongoDB.
   */
  static async getTrendOverTime() {
    AnalyticsService.verifyDbConnection();

    const analyses = await Analysis.find({ isLatest: true });
    if (!analyses || analyses.length === 0) return [];

    const reports = await SafetyReport.find({ reportId: { $in: analyses.map((a) => a.reportId) } });
    const reportMap = new Map();
    for (const r of reports) reportMap.set(r.reportId, r);

    const periodMap = new Map();

    for (const a of analyses) {
      const report = reportMap.get(a.reportId);
      const date = report?.normalizedReport?.eventDate ? new Date(report.normalizedReport.eventDate) : new Date(a.createdAt);
      const period = date.toISOString().substring(0, 7); // YYYY-MM

      if (!periodMap.has(period)) {
        periodMap.set(period, { period, totalReports: 0, sifPotentialCount: 0, totalScore: 0 });
      }

      const p = periodMap.get(period);
      p.totalReports++;
      if (a.sifClassification?.classification === "SIF_POTENTIAL") p.sifPotentialCount++;
      p.totalScore += a.riskScore?.score || 0;
    }

    return Array.from(periodMap.values())
      .map((p) => ({
        period: p.period,
        totalReports: p.totalReports,
        sifPotentialCount: p.sifPotentialCount,
        sifRate: p.totalReports > 0 ? Math.round((p.sifPotentialCount / p.totalReports) * 100) : 0,
        avgRiskScore: p.totalReports > 0 ? Math.round(p.totalScore / p.totalReports) : 0,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Retrieve barrier health & failure distributions computed dynamically from MongoDB.
   */
  static async getBarrierHealthAnalytics() {
    AnalyticsService.verifyDbConnection();

    const analyses = await Analysis.find({ isLatest: true });
    if (!analyses || analyses.length === 0) {
      return {
        overallResilienceScore: 100,
        statusBreakdown: { PRESENT_EFFECTIVE: 0, DEGRADED: 0, FAILED: 0, MISSING: 0 },
        hierarchyBreakdown: {},
        topFailedBarriers: [],
      };
    }

    const statusCounts = { PRESENT_EFFECTIVE: 0, DEGRADED: 0, FAILED: 0, MISSING: 0 };
    const hierarchyCounts = {};
    const failureCountMap = new Map();
    const allBarriers = [];

    for (const a of analyses) {
      for (const b of a.nlpExtraction?.barriers || []) {
        allBarriers.push(b);
        statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
        hierarchyCounts[b.category] = (hierarchyCounts[b.category] || 0) + 1;

        if (b.status === "FAILED" || b.status === "MISSING") {
          const count = failureCountMap.get(b.name) || 0;
          failureCountMap.set(b.name, { name: b.name, failCount: count + 1, category: b.category });
        }
      }
    }

    const resilience = BarrierService.calculateBarrierResilience(allBarriers);
    const topFailedBarriers = Array.from(failureCountMap.values())
      .sort((a, b) => b.failCount - a.failCount)
      .slice(0, 5);

    return {
      overallResilienceScore: resilience.score,
      statusBreakdown: statusCounts,
      hierarchyBreakdown: hierarchyCounts,
      topFailedBarriers,
    };
  }

  /**
   * Unified executive dashboard aggregation computed directly from MongoDB.
   */
  static async getFullExecutiveDashboard() {
    const [kpis, bySite, byPrecursor, trends, barrierHealth] = await Promise.all([
      AnalyticsService.getExecutiveKpis(),
      AnalyticsService.getBreakdownBySite(),
      AnalyticsService.getBreakdownByPrecursor(),
      AnalyticsService.getTrendOverTime(),
      AnalyticsService.getBarrierHealthAnalytics(),
    ]);

    return {
      kpis,
      bySite,
      byPrecursor,
      trends,
      barrierHealth,
    };
  }
}

export default AnalyticsService;
