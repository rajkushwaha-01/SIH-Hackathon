import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { sendError } from "../utils/apiResponse.js";
import { AppError } from "../utils/appError.js";

export const errorHandler = (err, req, res, _next) => {
  logger.error(`Error handling ${req.method} ${req.originalUrl}:`, err);

  // If it's a recognized operational AppError
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.errorCode, err.details);
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === "CastError") {
    return sendError(res, `Invalid resource identifier: ${err.value}`, 400, "INVALID_ID");
  }

  // Handle Mongoose ValidationError
  if (err.name === "ValidationError") {
    const details = Object.values(err.errors).map((e) => e.message);
    return sendError(res, "Validation failed", 400, "VALIDATION_ERROR", details);
  }

  // Handle MongoDB duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return sendError(res, `Duplicate entry for ${field}`, 409, "DUPLICATE_KEY_ERROR", { field });
  }

  // Handle JSON parse error (e.g. malformed body)
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return sendError(res, "Invalid JSON payload in request body", 400, "INVALID_JSON");
  }

  // Handle Multer upload errors
  if (err.name === "MulterError") {
    return sendError(res, `File upload error: ${err.message}`, 400, "FILE_UPLOAD_ERROR");
  }

  // Default unknown internal error
  const message = env.NODE_ENV === "production" ? "Internal Server Error" : err.message;
  return sendError(res, message, 500, "INTERNAL_SERVER_ERROR");
};

export const notFoundHandler = (req, res) => {
  return sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404, "ROUTE_NOT_FOUND");
};

export default {
  errorHandler,
  notFoundHandler,
};
