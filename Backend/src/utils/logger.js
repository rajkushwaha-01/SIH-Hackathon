const formatTimestamp = () => new Date().toISOString();

export const logger = {
  info: (message, meta = "") => {
    console.log(`[${formatTimestamp()}] [INFO] ${message}`, meta ? JSON.stringify(meta) : "");
  },
  warn: (message, meta = "") => {
    console.warn(`[${formatTimestamp()}] [WARN] ${message}`, meta ? JSON.stringify(meta) : "");
  },
  error: (message, error = "") => {
    console.error(`[${formatTimestamp()}] [ERROR] ${message}`, error ? (error.stack || error) : "");
  },
  debug: (message, meta = "") => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(`[${formatTimestamp()}] [DEBUG] ${message}`, meta ? JSON.stringify(meta) : "");
    }
  },
};

export default logger;
