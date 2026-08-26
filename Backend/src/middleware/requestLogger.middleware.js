import { logger } from "../utils/logger.js";

export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const { method, originalUrl, ip } = req;

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;
    const logMsg = `${method} ${originalUrl} ${statusCode} - ${duration}ms [${ip}]`;

    if (statusCode >= 500) {
      logger.error(logMsg);
    } else if (statusCode >= 400) {
      logger.warn(logMsg);
    } else {
      logger.info(logMsg);
    }
  });

  next();
};

export default requestLogger;
