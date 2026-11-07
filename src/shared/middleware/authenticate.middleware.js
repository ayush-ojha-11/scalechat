import { verifyAccessToken } from "../utils/jwt.js";
import { AppError } from "../errors/app-error.js";

export function authenticate(req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      throw new AppError("Authentication required", 401);
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      throw new AppError("Authentication required", 401);
    }
    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.sub,
      username: payload.username,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    }
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError" ||
      error.name === "NotBeforeError"
    ) {
      return next(new AppError("Invalid or expired token", 401));
    }

    next(error);
  }
}
