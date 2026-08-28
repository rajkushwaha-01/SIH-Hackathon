import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/appError.js";

export const authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("Authentication required. Please provide a valid Bearer token in the Authorization header.", 401, "UNAUTHORIZED"));
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return next(new AppError("Authentication token is missing.", 401, "TOKEN_MISSING"));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return next(new AppError("Authentication token has expired. Please login again.", 401, "TOKEN_EXPIRED"));
      }
      return next(new AppError("Invalid authentication token.", 401, "INVALID_TOKEN"));
    }

    if (mongoose.connection.readyState !== 1 || env.NODE_ENV === "test") {
      req.user = {
        _id: decoded.id,
        email: decoded.email,
        role: decoded.role || "HSE_OFFICER",
        name: decoded.name || "Lead HSE Officer",
        isActive: true,
      };
      return next();
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new AppError("The user belonging to this token no longer exists in the database.", 401, "USER_NOT_FOUND"));
    }

    if (!user.isActive) {
      return next(new AppError("User account has been deactivated.", 403, "ACCOUNT_DEACTIVATED"));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;
