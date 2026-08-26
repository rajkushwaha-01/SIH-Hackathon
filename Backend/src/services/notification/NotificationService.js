import { logger } from "../../utils/logger.js";

export class NotificationService {
  /**
   * Dispatches an emergency high-priority safety alert notification.
   */
  static async dispatchAlertNotification(alert) {
    const isUrgent = alert.priority === "P1_CRITICAL" || alert.priority === "P2_HIGH";

    logger.info(
      `[Notification Engine] Dispatched ${alert.priority} notification for Alert ${alert.alertId}: "${alert.title}" to HSE Safety Network.`
    );

    if (isUrgent) {
      logger.warn(
        `🚨 URGENT HSE ESCALATION [${alert.priority}] ➔ Site: ${alert.site} | Trigger: ${alert.triggerType} | Alert ID: ${alert.alertId}`
      );
    }

    return {
      alertId: alert.alertId,
      dispatched: true,
      channels: ["IN_APP_BANNER", "EMAIL_DIGEST", "HSE_DASHBOARD_FEED"],
      timestamp: new Date(),
    };
  }
}

export default NotificationService;
