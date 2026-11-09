import pino from "pino";
import { env } from "../../config/env.js";

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.body.password",
      "req.body.refreshToken",
      'res.headers["set-cookie"]',
    ],
    censor: "[REDACTED]",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
