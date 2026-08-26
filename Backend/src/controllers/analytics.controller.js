import { AnalyticsService } from "../services/analytics/AnalyticsService.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const getDashboard = async (_req, res, next) => {
  try {
    const dashboard = await AnalyticsService.getFullExecutiveDashboard();
    return sendSuccess(res, dashboard, "Executive Safety Intelligence Dashboard retrieved", 200);
  } catch (error) {
    next(error);
  }
};

export const getKpis = async (_req, res, next) => {
  try {
    const kpis = await AnalyticsService.getExecutiveKpis();
    return sendSuccess(res, kpis, "Executive KPIs retrieved", 200);
  } catch (error) {
    next(error);
  }
};

export const getSiteBreakdown = async (_req, res, next) => {
  try {
    const data = await AnalyticsService.getBreakdownBySite();
    return sendSuccess(res, data, "Site-level SIF breakdown retrieved", 200);
  } catch (error) {
    next(error);
  }
};

export const getPrecursorBreakdown = async (_req, res, next) => {
  try {
    const data = await AnalyticsService.getBreakdownByPrecursor();
    return sendSuccess(res, data, "Precursor distribution retrieved", 200);
  } catch (error) {
    next(error);
  }
};

export const getTrends = async (_req, res, next) => {
  try {
    const data = await AnalyticsService.getTrendOverTime();
    return sendSuccess(res, data, "Safety incident trends over time retrieved", 200);
  } catch (error) {
    next(error);
  }
};

export const getBarrierHealth = async (_req, res, next) => {
  try {
    const data = await AnalyticsService.getBarrierHealthAnalytics();
    return sendSuccess(res, data, "Enterprise barrier health analytics retrieved", 200);
  } catch (error) {
    next(error);
  }
};

export default {
  getDashboard,
  getKpis,
  getSiteBreakdown,
  getPrecursorBreakdown,
  getTrends,
  getBarrierHealth,
};
