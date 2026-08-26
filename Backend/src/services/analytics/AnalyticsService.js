import mongoose from "mongoose";
import { SafetyReport } from "../../models/SafetyReport.js";
import { Analysis } from "../../models/Analysis.js";
import { Pattern } from "../../models/Pattern.js";
import { PRECURSOR_TAXONOMY } from "../../constants/precursor.constants.js";
import { BarrierService } from "../barrier/BarrierService.js";
import { logger } from "../../utils/logger.js";

export class AnalyticsService {
  /**
   * Retrieve high-level KPI cards.
   */
  static async getExecutiveKpis(filters = {}) {
    if (mongoose.connection.readyState !== 1) {
      return AnalyticsService.getMockKpis();
    }

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

    return {
      totalReports,
      analyzedReports,
      sifPotentialCount,
      sifRate,
      criticalRiskCount,
      highRiskCount,
      activePatternsCount,
      barrierHealthScore: 78,
    };
  }

  /**
   * Retrieve breakdown by Site.
   */
  static async getBreakdownBySite() {
    if (mongoose.connection.readyState !== 1) {
      return [
        { site: "Offshore Platform Alpha", totalReports: 12, sifCount: 5, sifRate: 42, avgRiskScore: 72 },
        { site: "Refinery Unit 4", totalReports: 8, sifCount: 2, sifRate: 25, avgRiskScore: 58 },
        { site: "Chemical Terminal B", totalReports: 6, sifCount: 1, sifRate: 17, avgRiskScore: 46 },
      ];
    }

    const analyses = await Analysis.find({ isLatest: true });
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

    return Array.from(siteMap.values()).map((s) => ({
      site: s.site,
      totalReports: s.totalReports,
      sifCount: s.sifCount,
      sifRate: s.totalReports > 0 ? Math.round((s.sifCount / s.totalReports) * 100) : 0,
      avgRiskScore: s.totalReports > 0 ? Math.round(s.totalScore / s.totalReports) : 0,
    })).sort((a, b) => b.sifRate - a.sifRate);
  }

  /**
   * Retrieve breakdown by Precursor.
   */
  static async getBreakdownByPrecursor() {
    if (mongoose.connection.readyState !== 1) {
      return [
        { precursor: "WORKING_AT_HEIGHT", count: 8, sifCount: 5, sifRate: 63 },
        { precursor: "ELECTRICAL_EXPOSURE", count: 6, sifCount: 4, sifRate: 67 },
        { precursor: "DROPPED_OBJECTS", count: 5, sifCount: 3, sifRate: 60 },
        { precursor: "ISOLATION_FAILURE", count: 5, sifCount: 4, sifRate: 80 },
        { precursor: "LINE_OF_FIRE", count: 4, sifCount: 2, sifRate: 50 },
      ];
    }

    const analyses = await Analysis.find({ isLatest: true });
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

    return Array.from(precMap.values()).map((p) => ({
      precursor: p.precursor,
      count: p.count,
      sifCount: p.sifCount,
      sifRate: p.count > 0 ? Math.round((p.sifCount / p.count) * 100) : 0,
    })).sort((a, b) => b.count - a.count);
  }

  /**
   * Retrieve monthly/weekly trends over time.
   */
  static async getTrendOverTime() {
    if (mongoose.connection.readyState !== 1) {
      return [
        { period: "2026-01", totalReports: 8, sifPotentialCount: 3, sifRate: 38, avgRiskScore: 64 },
        { period: "2026-02", totalReports: 12, sifPotentialCount: 4, sifRate: 33, avgRiskScore: 61 },
        { period: "2026-03", totalReports: 15, sifPotentialCount: 5, sifRate: 33, avgRiskScore: 59 },
      ];
    }

    const analyses = await Analysis.find({ isLatest: true });
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

    return Array.from(periodMap.values()).map((p) => ({
      period: p.period,
      totalReports: p.totalReports,
      sifPotentialCount: p.sifPotentialCount,
      sifRate: p.totalReports > 0 ? Math.round((p.sifPotentialCount / p.totalReports) * 100) : 0,
      avgRiskScore: p.totalReports > 0 ? Math.round(p.totalScore / p.totalReports) : 0,
    })).sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Retrieve barrier health & failure distributions.
   */
  static async getBarrierHealthAnalytics() {
    if (mongoose.connection.readyState !== 1) {
      return {
        overallResilienceScore: 78,
        statusBreakdown: {
          PRESENT_EFFECTIVE: 42,
          DEGRADED: 14,
          FAILED: 9,
          MISSING: 6,
        },
        hierarchyBreakdown: {
          ENGINEERING: 35,
          ADMINISTRATIVE: 20,
          PPE: 16,
        },
        topFailedBarriers: [
          { name: "Lockout / Tagout (LOTO)", failCount: 6, category: "ENGINEERING" },
          { name: "100% Fall Arrest Harness", failCount: 5, category: "PPE" },
          { name: "Zero Voltage Verification", failCount: 4, category: "PROCEDURAL" },
          { name: "Tool Tethering Lanyard", failCount: 4, category: "ENGINEERING" },
        ],
      };
    }

    const analyses = await Analysis.find({ isLatest: true });
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
   * Unified executive dashboard aggregation.
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

  static getMockKpis() {
    return {
      totalReports: 26,
      analyzedReports: 26,
      sifPotentialCount: 9,
      sifRate: 35,
      criticalRiskCount: 6,
      highRiskCount: 8,
      activePatternsCount: 3,
      barrierHealthScore: 78,
    };
  }
}

export default AnalyticsService;
