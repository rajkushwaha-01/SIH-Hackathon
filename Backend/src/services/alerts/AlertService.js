import mongoose from "mongoose";
import { Alert } from "../../models/Alert.js";
import { NotificationService } from "../notification/NotificationService.js";
import { AppError } from "../../utils/appError.js";
import { logger } from "../../utils/logger.js";

export class AlertService {
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

    // Trigger Rule 3: High Risk Event Notice
    if (isHighRisk && !isCriticalRisk && generatedAlerts.length === 0) {
      const deduplicationKey = `HIGH_RISK:${site}:${precursors[0]?.type || "GENERAL"}`;
      const alert = await AlertService.createOrUpdateAlert({
        title: `High Risk Event Detected at ${site}`,
        description: `High risk score (${analysis.riskScore.score}/100) calculated due to dominant factor: ${analysis.riskScore.dominantFactor}.`,
        triggerType: "CRITICAL_SIF_EMERGENCE",
        priority: "P2_HIGH",
        sourceReportId: report.reportId,
        site,
        targetPrecursor: precursors[0]?.type || "",
        deduplicationKey,
        recommendedActions: [
          { action: "Audit critical safety barrier compliance for task area", assignedRole: "HSE_OFFICER" },
        ],
      });
      generatedAlerts.push(alert);
    }

    return generatedAlerts;
  }

  /**
   * Helper to create or deduplicate alerts within a 24-hour suppression window.
   */
  static async createOrUpdateAlert(alertData) {
    if (mongoose.connection.readyState !== 1) {
      return { alertId: `ALT-${Date.now().toString().slice(-4)}`, ...alertData, status: "OPEN" };
    }

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
   * Retrieve alerts with optional filtering.
   */
  static async getAlerts(filters = {}) {
    if (mongoose.connection.readyState !== 1) {
      return [
        {
          alertId: "ALT-2026-0001",
          title: "🚨 P1 CRITICAL SIF EMERGENCE at Offshore Platform Alpha",
          description: "Critical SIF Potential detected involving Working at Height with failed fall arrest.",
          triggerType: "CRITICAL_SIF_EMERGENCE",
          priority: "P1_CRITICAL",
          status: "OPEN",
          site: "Offshore Platform Alpha",
          targetPrecursor: "WORKING_AT_HEIGHT",
          createdAt: new Date(),
        },
      ];
    }

    const query = {};
    if (filters.priority) query.priority = filters.priority;
    if (filters.status) query.status = filters.status;
    if (filters.site) query.site = filters.site;
    if (filters.triggerType) query.triggerType = filters.triggerType;

    return Alert.find(query).sort({ priority: 1, createdAt: -1 });
  }

  /**
   * Retrieve single alert by ID.
   */
  static async getAlertById(alertId) {
    if (mongoose.connection.readyState !== 1) {
      return {
        alertId,
        title: "P1 CRITICAL SIF Alert",
        priority: "P1_CRITICAL",
        status: "OPEN",
        site: "Site Alpha",
        recommendedActions: [{ action: "Stop work authority", assignedRole: "HSE_OFFICER" }],
      };
    }

    const alert = await Alert.findOne({ alertId });
    if (!alert) {
      throw new AppError(`Alert '${alertId}' not found`, 404, "ALERT_NOT_FOUND");
    }
    return alert;
  }

  /**
   * Acknowledge alert.
   */
  static async acknowledgeAlert(alertId, userId = null) {
    if (mongoose.connection.readyState !== 1) {
      return { alertId, status: "ACKNOWLEDGED", acknowledgedAt: new Date() };
    }

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
      throw new AppError(`Alert '${alertId}' not found`, 404, "ALERT_NOT_FOUND");
    }

    return alert;
  }

  /**
   * Resolve alert with resolution notes.
   */
  static async resolveAlert(alertId, resolutionNotes = "Action items completed", userId = null) {
    if (mongoose.connection.readyState !== 1) {
      return { alertId, status: "RESOLVED", resolutionNotes, resolvedAt: new Date() };
    }

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
      throw new AppError(`Alert '${alertId}' not found`, 404, "ALERT_NOT_FOUND");
    }

    return alert;
  }

  /**
   * Dismiss alert.
   */
  static async dismissAlert(alertId, reason = "Dismissed by HSE Authority", userId = null) {
    if (mongoose.connection.readyState !== 1) {
      return { alertId, status: "DISMISSED", resolutionNotes: reason };
    }

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
      throw new AppError(`Alert '${alertId}' not found`, 404, "ALERT_NOT_FOUND");
    }

    return alert;
  }

  /**
   * Retrieve alert summary statistics.
   */
  static async getAlertStats() {
    if (mongoose.connection.readyState !== 1) {
      return {
        totalOpen: 3,
        p1Critical: 1,
        p2High: 2,
        acknowledged: 1,
        resolved: 5,
      };
    }

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
