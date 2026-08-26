export const sendSuccess = (res, data = null, message = "Success", statusCode = 200, meta = null) => {
  const response = {
    success: true,
    message,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

export const sendError = (res, message = "An error occurred", statusCode = 500, errorCode = "INTERNAL_SERVER_ERROR", details = null) => {
  const response = {
    success: false,
    error: {
      code: errorCode,
      message,
    },
  };

  if (details) {
    response.error.details = details;
  }

  return res.status(statusCode).json(response);
};

export default {
  sendSuccess,
  sendError,
};
