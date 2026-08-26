import { AppError } from "../utils/appError.js";

export const authorize = (...allowedRoles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError("User not authenticated", 401, "UNAUTHORIZED"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Role '${req.user.role}' is not authorized to perform this action. Required: [${allowedRoles.join(", ")}]`,
          403,
          "FORBIDDEN"
        )
      );
    }

    next();
  };
};

export const requireRole = authorize;

export default authorize;
