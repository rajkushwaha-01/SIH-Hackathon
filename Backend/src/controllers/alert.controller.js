import { AlertService } from "../services/alerts/AlertService.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const getAlerts = async (req, res, next) => {
  try {
    const alerts = await AlertService.getAlerts(req.query);
    return sendSuccess(res, alerts, "Smart HSE alerts retrieved", 200);
  } catch (error) {
    next(error);
  }
};

export const getAlertById = async (req, res, next) => {
  try {
    const alert = await AlertService.getAlertById(req.params.id);
    return sendSuccess(res, alert, `Details for alert ${req.params.id}`, 200);
  } catch (error) {
    next(error);
  }
};

export const acknowledgeAlert = async (req, res, next) => {
  try {
    const alert = await AlertService.acknowledgeAlert(req.params.id, req.user?.id);
    return sendSuccess(res, alert, "Alert acknowledged successfully", 200);
  } catch (error) {
    next(error);
  }
};

export const resolveAlert = async (req, res, next) => {
  try {
    const { resolutionNotes } = req.body;
    const alert = await AlertService.resolveAlert(req.params.id, resolutionNotes, req.user?.id);
    return sendSuccess(res, alert, "Alert resolved successfully", 200);
  } catch (error) {
    next(error);
  }
};

export const dismissAlert = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const alert = await AlertService.dismissAlert(req.params.id, reason, req.user?.id);
    return sendSuccess(res, alert, "Alert dismissed successfully", 200);
  } catch (error) {
    next(error);
  }
};

export const getAlertStats = async (_req, res, next) => {
  try {
    const stats = await AlertService.getAlertStats();
    return sendSuccess(res, stats, "Alert summary statistics retrieved", 200);
  } catch (error) {
    next(error);
  }
};

export default {
  getAlerts,
  getAlertById,
  acknowledgeAlert,
  resolveAlert,
  dismissAlert,
  getAlertStats,
};
