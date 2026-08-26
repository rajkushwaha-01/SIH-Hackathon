import jwt from "jsonwebtoken";
import { User } from "../../models/User.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/appError.js";
import { logger } from "../../utils/logger.js";

export class AuthService {
  /**
   * Generate JWT Token for user
   */
  static generateToken(user) {
    const payload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    };

    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });
  }

  /**
   * Register a new user
   */
  static async registerUser(userData) {
    const { email, password, name, role, site, department } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError(`User with email '${email}' already exists`, 409, "USER_ALREADY_EXISTS");
    }

    // Create new user
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: role || "HSE_OFFICER",
      site: site || "All Sites",
      department: department || "HSE",
    });

    await newUser.save();
    logger.info(`New user registered successfully: ${newUser.email} [${newUser.role}]`);

    const token = AuthService.generateToken(newUser);

    return {
      user: newUser.toJSON(),
      token,
      tokenType: "Bearer",
      expiresIn: env.JWT_EXPIRES_IN,
    };
  }

  /**
   * Login user with credentials
   */
  static async loginUser({ email, password }) {
    // Explicitly select password field since it is select: false by default
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    if (!user.isActive) {
      throw new AppError("Account has been deactivated. Please contact an administrator.", 403, "ACCOUNT_DEACTIVATED");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    logger.info(`User logged in successfully: ${user.email} [${user.role}]`);

    const token = AuthService.generateToken(user);

    return {
      user: user.toJSON(),
      token,
      tokenType: "Bearer",
      expiresIn: env.JWT_EXPIRES_IN,
    };
  }

  /**
   * Get user profile by ID
   */
  static async getUserProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }
    return user.toJSON();
  }
}

export default AuthService;
