import { createServer } from "node:http";
import app from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./infrastructure/database/index.js";
import { logger } from "./shared/utils/logger.js";

const httpServer = createServer(app);
const SHUTDOWN_TIMEOUT = 10000;

let isShuttingDown = false;

httpServer.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, `ScaleChat server started`);
});

function shutdown(signal) {
  if (isShuttingDown) return;

  isShuttingDown = true;

  logger.info({ signal }, `Graceful shutdown started`);

  const forceShutdown = setTimeout(() => {
    logger.error("Graceful shutdown timed out");
    httpServer.closeAllConnections();
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);

  forceShutdown.unref();

  httpServer.close(async (error) => {
    try {
      if (error) {
        logger.error({ error }, "HTTP server shutdown failed");
        process.exitCode = 1;
      }

      await pool.end();

      logger.info("Database connections closed");
    } catch (error) {
      logger.error({ error: error }, "Database shutdown failed");
      process.exitCode = 1;
    } finally {
      clearTimeout(forceShutdown);
    }
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
