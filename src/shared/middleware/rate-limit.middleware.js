import { rateLimit } from "express-rate-limit";

const createLimiter = (limit, message) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      message,
    },
  });

export const registerLimiter = createLimiter(
  5,
  "Too many registration attempts. Try again later.",
);

export const loginLimiter = createLimiter(
  10,
  "Too many login attempts. Try again later.",
);

export const refreshLimiter = createLimiter(
  30,
  "Too many refresh attempts. Try again later.",
);
