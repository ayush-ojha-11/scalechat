import { AppError } from "../errors/app-error.js";

export function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return next(new AppError("Validation failed", 400, errors));
    }

    req.validated = req.validated || {};
    req.validated[source] = result.data; // equivalent to req.validated.body or req.validated.query (validated is an object)

    next();
  };
}
