import { AuthService } from "../services/auth/AuthService.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const register = async (req, res, next) => {
  try {
    const result = await AuthService.registerUser(req.body);
    return sendSuccess(res, result, "User registered successfully", 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await AuthService.loginUser(req.body);
    return sendSuccess(res, result, "Login successful", 200);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const userProfile = await AuthService.getUserProfile(req.user._id);
    return sendSuccess(res, userProfile, "Current user profile retrieved", 200);
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  getMe,
};
