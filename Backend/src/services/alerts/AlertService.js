import mongoose from "mongoose";
import { Alert } from "../../models/Alert.js";
import { NotificationService } from "../notification/NotificationService.js";
import { AppError } from "../../utils/appError.js";
import { logger } from "../../utils/logger.js";

export class AlertService {
  /**
   * Check if MongoDB is connected; throw error if offline (Rule 20: No Silent Fallback).
   */
  static verifyDbConnection() {
    if (mongoose.connection.readyState !== 1) {
      throw new AppError(
        "Database is offline or disconnected. Cannot process HSE alerts.",
        503,
        "DATABASE_DISCONNECTED"
      );
    }
  }

  /**
   * Evaluates a freshly analyzed safety report against alert trigger rules and creates deduplicated alerts.
   */
  static async evaluateReportAlerts(report, analysis) {
    if (!report || !analysis) return [];

    const site = report.normalizedReport?.site || "General Site";
    const isSif = analysis.sifClassification?.classification === "SIF_POTENTIAL";
    const isCriticalRisk = analysis.riskScore?.level === "CRITICAL";
    const isHighRisk = analysis.riskScore?.level === "HIGH";
    const precursors = analysis.precursors || [];

    const generatedAlerts = [];

    // Trigger Rule 1: CRITICAL_SIF_EMERGENCE
    if (isSif && isCriticalRisk) {
      const deduplicationKey = `CRITICAL_SIF:${site}:${precursors[0]?.type || "GENERAL"}`;
      const alert = await AlertService.createOrUpdateAlert({
        title: `🚨 P1 CRITICAL SIF EMERGENCE at ${site}`,
        description: `A critical incident possessing severe Serious Injury & Fatality (SIF) potential was detected. Immediate executive HSE intervention required.`,
        triggerType: "CRITICAL_SIF_EMERGENCE",
        priority: "P1_CRITICAL",
        sourceReportId: report.reportId,
        site,
        targetPrecursor: precursors[0]?.type || "",
        deduplicationKey,
        recommendedActions: [
          { action: "Issue immediate operational stop-work authority on affected system", assignedRole: "HSE_OFFICER" },
          { action: "Conduct emergency physical barrier verification with site superintendent", assignedRole: "REVIEWER" },
          { action: "Deploy secondary independent barrier inspection team", assignedRole: "ADMIN" },
        ],
      });
      generatedAlerts.push(alert);
    }

    // Trigger Rule 2: MULTIPLE_PRECURSOR_CONVERGENCE
    if (precursors.length >= 3) {
      const deduplicationKey = `MULTI_PREC:${site}:${report.reportId}`;
      const alert = await AlertService.createOrUpdateAlert({
        title: `⚠️ Multiple Precursor Convergence (${precursors.length} Concurrent Hazards) at ${site}`,
        description: `Incident involves ${precursors.length} active precursor conditions simultaneously (${precursors.map((p) => p.type).join(", ")}), drastically compounding failure probability.`,
        triggerType: "MULTIPLE_PRECURSOR_CONVERGENCE",
        priority: "P1_CRITICAL",
        sourceReportId: report.reportId,
        site,
        targetPrecursor: precursors[0]?.type || "",
        deduplicationKey,
        recommendedActions: [
          { action: "Perform multi-discipline simultaneous operations (SIMOPS) review", assignedRole: "HSE_OFFICER" },
          { action: "Re-assess Job Safety Analysis (JSA) for concurrent high-energy tasks", assignedRole: "REVIEWER" },
        ],
      });
      generatedAlerts.push(alert);
    }

    // Trigger Rule 3: SYSTEMIC_BARRIER_FAILURE
    const failedCriticalBarriers =
      analysis.nlpExtraction?.barriers?.filter(
        (b) => (b.status === "FAILED" || b.status === "MISSING") && (b.category === "ENGINEERING" || b.category === "PPE")
      ) || [];

    if (failedCriticalBarriers.length > 0) {
      const barrierName = failedCriticalBarriers[0].name;
      const deduplicationKey = `BARRIER_FAIL:${barrierName}:${site}`;
      const alert = await AlertService.createOrUpdateAlert({
        title: `🛡️ Defense Barrier Breach: ${barrierName} at ${site}`,
        description: `Critical physical or engineered defense barrier '${barrierName}' was detected in FAILED or MISSING state during work execution.`,
        triggerType: "SYSTEMIC_BARRIER_FAILURE",
        priority: isSif ? "P1_CRITICAL" : "P2_HIGH",
        sourceReportId: report.reportId,
        site,
        targetPrecursor: precursors[0]?.type || "",
        deduplicationKey,
        recommendedActions: [
          { action: `Perform physical inspection and certification on ${barrierName}`, assignedRole: "HSE_OFFICER" },
          { action: "Audit preventative maintenance logs for affected safety equipment", assignedRole: "REVIEWER" },
        ],
      });
      generatedAlerts.push(alert);
    }

    return generatedAlerts;
  }

  /**
   * Helper to create or deduplicate alerts in MongoDB within a 24-hour suppression window.
   */
  static async createOrUpdateAlert(alertData) {
    AlertService.verifyDbConnection();

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Look for existing active alert with same deduplicationKey within 24h
    let existingAlert = await Alert.findOne({
      deduplicationKey: alertData.deduplicationKey,
      status: { $in: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS"] },
      createdAt: { $gte: twentyFourHoursAgo },
    });

    if (existingAlert) {
      logger.info(`Deduplicating alert ${existingAlert.alertId} for key: ${alertData.deduplicationKey}`);
      existingAlert.description += ` | Additional trigger instance linked from report ${alertData.sourceReportId}.`;
      await existingAlert.save();
      return existingAlert;
    }

    const alertId = `ALT-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const newAlert = new Alert({
      alertId,
      ...alertData,
      status: "OPEN",
    });

    await newAlert.save();
    await NotificationService.dispatchAlertNotification(newAlert);
    return newAlert;
  }

  /**
   * Retrieve alerts with optional filtering from MongoDB.
   */
  static async getAlerts(filters = {}) {
    AlertService.verifyDbConnection();

    const query = {};
    if (filters.priority) query.priority = filters.priority;
    if (filters.status) query.status = filters.status;
    if (filters.site) query.site = filters.site;
    if (filters.triggerType) query.triggerType = filters.triggerType;

    return Alert.find(query).sort({ priority: 1, createdAt: -1 });
  }

  /**
   * Retrieve single alert by ID from MongoDB.
   */
  static async getAlertById(alertId) {
    AlertService.verifyDbConnection();

    const alert = await Alert.findOne({ alertId });
    if (!alert) {
      throw new AppError(`Alert '${alertId}' not found in database`, 404, "ALERT_NOT_FOUND");
    }
    return alert;
  }

  /**
   * Acknowledge alert in MongoDB.
   */
  static async acknowledgeAlert(alertId, userId = null) {
    AlertService.verifyDbConnection();

    const alert = await Alert.findOneAndUpdate(
      { alertId },
      {
        $set: {
          status: "ACKNOWLEDGED",
          acknowledgedBy: userId,
          acknowledgedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!alert) {
      throw new AppError(`Alert '${alertId}' not found in database`, 404, "ALERT_NOT_FOUND");
    }

    return alert;
  }

  /**
   * Resolve alert with resolution notes in MongoDB.
   */
  static async resolveAlert(alertId, resolutionNotes = "Action items completed", userId = null) {
    AlertService.verifyDbConnection();

    const alert = await Alert.findOneAndUpdate(
      { alertId },
      {
        $set: {
          status: "RESOLVED",
          resolvedBy: userId,
          resolvedAt: new Date(),
          resolutionNotes,
        },
      },
      { new: true }
    );

    if (!alert) {
      throw new AppError(`Alert '${alertId}' not found in database`, 404, "ALERT_NOT_FOUND");
    }

    return alert;
  }

  /**
   * Dismiss alert in MongoDB.
   */
  static async dismissAlert(alertId, reason = "Dismissed by HSE Authority", userId = null) {
    AlertService.verifyDbConnection();

    const alert = await Alert.findOneAndUpdate(
      { alertId },
      {
        $set: {
          status: "DISMISSED",
          resolvedBy: userId,
          resolvedAt: new Date(),
          resolutionNotes: `DISMISSED: ${reason}`,
        },
      },
      { new: true }
    );

    if (!alert) {
      throw new AppError(`Alert '${alertId}' not found in database`, 404, "ALERT_NOT_FOUND");
    }

    return alert;
  }

  /**
   * Retrieve alert summary statistics from MongoDB.
   */
  static async getAlertStats() {
    AlertService.verifyDbConnection();

    const [totalOpen, p1Critical, p2High, acknowledged, resolved] = await Promise.all([
      Alert.countDocuments({ status: "OPEN" }),
      Alert.countDocuments({ priority: "P1_CRITICAL", status: { $in: ["OPEN", "ACKNOWLEDGED"] } }),
      Alert.countDocuments({ priority: "P2_HIGH", status: { $in: ["OPEN", "ACKNOWLEDGED"] } }),
      Alert.countDocuments({ status: "ACKNOWLEDGED" }),
      Alert.countDocuments({ status: "RESOLVED" }),
    ]);

    return {
      totalOpen,
      p1Critical,
      p2High,
      acknowledged,
      resolved,
    };
  }
}

export default AlertService;
