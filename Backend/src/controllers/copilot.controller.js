import { HseCopilotService } from "../services/copilot/HseCopilotService.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { AppError } from "../utils/appError.js";

export const createSession = async (req, res, next) => {
  try {
    const session = await HseCopilotService.createSession({
      userId: req.user?.id,
      initialQuery: req.body?.initialQuery,
      contextScope: req.body?.contextScope,
    });
    return sendSuccess(res, session, "Copilot conversation session created", 201);
  } catch (error) {
    next(error);
  }
};

export const getSessions = async (req, res, next) => {
  try {
    const sessions = await HseCopilotService.getSessions(req.user?.id);
    return sendSuccess(res, sessions, "User copilot sessions retrieved", 200);
  } catch (error) {
    next(error);
  }
};

export const getSessionById = async (req, res, next) => {
  try {
    const session = await HseCopilotService.getSessionById(req.params.sessionId, req.user?.id);
    return sendSuccess(res, session, `Copilot session ${req.params.sessionId}`, 200);
  } catch (error) {
    next(error);
  }
};

export const deleteSession = async (req, res, next) => {
  try {
    const result = await HseCopilotService.deleteSession(req.params.sessionId, req.user?.id);
    return sendSuccess(res, result, `Copilot session deleted`, 200);
  } catch (error) {
    next(error);
  }
};

export const chat = async (req, res, next) => {
  try {
    const { sessionId, query } = req.body;
    if (!query || typeof query !== "string" || !query.trim()) {
      throw new AppError("Message query is required", 400, "INVALID_QUERY");
    }

    const response = await HseCopilotService.chat({
      sessionId,
      query,
      userId: req.user?.id,
    });

    return sendSuccess(res, response, "Grounded Copilot response generated", 200);
  } catch (error) {
    next(error);
  }
};

export const chatStream = async (req, res) => {
  const { sessionId, query } = req.body;
  if (!query || typeof query !== "string" || !query.trim()) {
    return res.status(400).json({ success: false, error: { message: "Message query is required" } });
  }

  await HseCopilotService.chatStream({
    sessionId,
    query,
    userId: req.user?.id,
    res,
  });
};

export default {
  createSession,
  getSessions,
  getSessionById,
  deleteSession,
  chat,
  chatStream,
};
