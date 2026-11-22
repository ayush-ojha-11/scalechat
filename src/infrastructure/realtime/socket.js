import { Server } from "socket.io";
import { verifyAccessToken } from "../../shared/utils/jwt.js";
import { logger } from "../../shared/utils/logger.js";

export function initializeSocketServer(httpServer) {
  const io = new Server(httpServer);

  // Authenticate every incoming socket connection
  io.use((socket, next) => {
    const authToken = socket.handshake.auth?.token;

    const authorization = socket.handshake.headers.authorization;

    const headerToken = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : null;

    const token = authToken || headerToken;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const payload = verifyAccessToken(token);
      socket.data.user = {
        id: payload.sub,
        username: payload.username,
      };
      next();
    } catch (error) {
      next(new Error("Invalid or expired access token"));
    }
  });

  // Runs after successful authentication
  io.on("connection", (socket) => {
    logger.info(
      {
        socketId: socket.id,
        userId: socket.data.user.id,
      },
      "Socket connected",
    );

    socket.on("disconnect", (reason) => {
      logger.info(
        {
          socketId: socket.id,
          userId: socket.data.user.id,
          reason,
        },
        "Socket Disconnected",
      );
    });
  });

  return io;
}
