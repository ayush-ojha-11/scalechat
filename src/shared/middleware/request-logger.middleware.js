import { randomUUID } from "node:crypto";
import pinoHttp from "pino-http";

import { logger } from "../utils/logger.js";

export const requestLogger = pinoHttp({
  logger,

  genReqId(req, res) {
    const requestId = req.headers["x-request-id"];

    const id =
      typeof requestId === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(requestId)
        ? requestId
        : randomUUID();

    res.setHeader("x-request-id", id);

    return id;
  },

  customLogLevel(req, res, error) {
    if (error || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
});
