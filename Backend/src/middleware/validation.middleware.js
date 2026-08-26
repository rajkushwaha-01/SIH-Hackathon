import { AppError } from "../utils/appError.js";

export const validateRequest = (schemas) => {
  return (req, _res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      next();
    } catch (error) {
      if (error.errors && Array.isArray(error.errors)) {
        const errorMessages = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`);
        return next(new AppError("Validation failed", 400, "VALIDATION_ERROR", errorMessages));
      }
      return next(new AppError("Invalid request data", 400, "VALIDATION_ERROR", error.message));
    }
  };
};

export const validateBody = (schema) => validateRequest({ body: schema });
export const validateQuery = (schema) => validateRequest({ query: schema });
export const validateParams = (schema) => validateRequest({ params: schema });
export const validate = validateBody;

export default validateRequest;
