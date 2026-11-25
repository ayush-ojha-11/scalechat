import { Server } from "socket.io";
import { verifyAccessToken } from "../../shared/utils/jwt.js";
import { logger } from "../../shared/utils/logger.js";
import { z } from "zod";
import { canAccessConversation } from "../../modules/messages/messages.service.js";
import {
  sendMessage,
  markMessageDelivered,
  markConversationMessagesRead,
} from "../../modules/messages/messages.service.js";
import { updateUserLastSeen } from "../../modules/users/users.service.js";
import { AppError } from "../../shared/errors/app-error.js";

// Tracks active Socket.IO connections per user.
// Key: user ID
// Value: Set of socket IDs
const activeConnections = new Map();

// returns true when the user transitions from offline to online
function addUserConnection(userId, socketId) {
  let connections = activeConnections.get(userId);

  if (!connections) {
    connections = new Set();
    activeConnections.set(userId, connections);
  }

  const wasOffline = connections.size === 0;
  connections.add(socketId);

  return wasOffline;
}

//returns true when the user transitions from online to offline
function removeUserConnection(userId, socketId) {
  const connections = activeConnections.get(userId);

  if (!connections) return false;

  connections.delete(socketId);

  if (connections.size === 0) {
    activeConnections.delete(userId);
    return true;
  }

  return false;
}

export function initializeSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: [
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:5501",
        "http://127.0.0.1:5501",
      ],
      methods: ["GET", "POST"],
    },
  });

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
    // Online status management
    const userId = socket.data.user.id;
    const becameOnline = addUserConnection(userId, socket.id);

    logger.info(
      {
        socketId: socket.id,
        userId,
        activeConnections: activeConnections.get(userId)?.size,
      },
      "Socket connected",
    );

    if (becameOnline) {
      socket.broadcast.emit("presence:update", {
        userId,
        status: "online",
        lastSeenAt: null,
      });
    }

    socket.on("conversation:join", async (payload, acknowledge) => {
      const reply = typeof acknowledge === "function" ? acknowledge : () => {};
      // validate incoming payload
      const result = z
        .object({
          conversationId: z.string().uuid(),
        })
        .safeParse(payload);

      if (!result.success) {
        return reply({
          success: false,
          message: "Invalid conversation ID",
        });
      }
      const { conversationId } = result.data;

      try {
        // verify conversation membership
        const isParticipant = await canAccessConversation({
          conversationId,
          userId: socket.data.user.id,
        });

        if (!isParticipant) {
          return reply({
            success: false,
            message: "Conversation not found",
          });
        }

        // Join the authorized room
        const room = `conversation:${conversationId}`;
        await socket.join(room);
        logger.info(
          {
            userId: socket.data.user.id,
            conversationId,
            socketId: socket.id,
          },
          "User joined conversation room",
        );

        return reply({
          success: true,
          message: "Joined conversation successfully",
          data: {
            conversationId,
          },
        });
      } catch (error) {
        logger.error({ error }, "Failed to join conversation");

        return reply({
          success: false,
          message: "Unable to join conversation",
        });
      }
    });

    socket.on("message:send", async (payload, acknowledge) => {
      const reply = typeof acknowledge === "function" ? acknowledge : () => {};
      const schema = z.object({
        conversationId: z.string().uuid(),
        content: z.string().trim().min(1).max(5000),
      });
      const result = schema.safeParse(payload);

      if (!result.success) {
        return reply({
          success: false,
          message: "Invalid message payload",
          errors: result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      const { conversationId, content } = result.data;
      const room = `conversation:${conversationId}`;

      //require the socket to join the conversation first
      if (!socket.rooms.has(room)) {
        return reply({
          success: false,
          message: "Join the conversation before sending messages",
        });
      }

      try {
        const message = await sendMessage({
          conversationId,
          senderId: socket.data.user.id,
          content,
        });

        // Deliver to other sockets in this conversation room.
        socket.to(room).emit("message:new", message);

        // Confirm successful persistence to sender
        return reply({
          success: true,
          message: "Message sent successfully",
          data: message,
        });
      } catch (error) {
        logger.error(
          {
            error,
            userId: socket.data.user.id,
            conversationId,
          },
          "Failed to send real-time message",
        );

        return reply({
          success: false,
          message: "Unable to send message",
        });
      }
    });

    socket.on("typing:start", (payload) => {
      const result = z
        .object({
          conversationId: z.string().uuid(),
        })
        .safeParse(payload);

      if (!result.success) return;

      const room = `conversation:${result.data.conversationId}`;

      // Only members who joined this room can broadcast typing events.
      if (!socket.rooms.has(room)) return;

      socket.to(room).emit("typing:update", {
        conversationId: result.data.conversationId,
        userId: socket.data.user.id,
        username: socket.data.user.username,
        isTyping: true,
      });
    });

    socket.on("typing:stop", (payload) => {
      const result = z
        .object({
          conversationId: z.string().uuid(),
        })
        .safeParse(payload);

      if (!result.success) return;

      const room = `conversation:${result.data.conversationId}`;

      if (!socket.rooms.has(room)) return;

      socket.to(room).emit("typing:update", {
        conversationId: result.data.conversationId,
        userId: socket.data.user.id,
        username: socket.data.user.username,
        isTyping: false,
      });
    });

    socket.on("message:delivered", async (payload, acknowledge) => {
      const reply = typeof acknowledge === "function" ? acknowledge : () => {};

      const result = z
        .object({
          messageId: z.string().uuid(),
        })
        .safeParse(payload);

      if (!result.success) {
        return reply({
          success: false,
          message: "Invalid message ID",
        });
      }

      const { messageId } = result.data;
      try {
        const receipt = await markMessageDelivered({
          messageId,
          userId: socket.data.user.id,
        });

        if (!receipt) {
          return reply({
            success: false,
            message: "Delivery receipt not found or already processed",
          });
        }

        const room = `conversation:${receipt.conversation_id}`;

        // Notify conversation participants about delivery
        io.to(room).emit("message:status", {
          messageId: receipt.message_id,
          userId: receipt.user_id,
          status: "delivered",
          deliveredAt: receipt.delivered_at,
        });

        return reply({
          success: true,
          message: "Message marked as delivered",
        });
      } catch (error) {
        logger.error(
          { error, messageId },
          "Failed to mark message as delivered",
        );

        return reply({
          success: false,
          message: "Unable to update delivery status",
        });
      }
    });

    socket.on("conversation:read", async (payload, acknowledge) => {
      const reply = typeof acknowledge === "function" ? acknowledge : () => {};

      const result = z
        .object({
          conversationId: z.string().uuid(),
        })
        .safeParse(payload);

      if (!result.success) {
        return reply({
          success: false,
          message: "Invalid conversation ID",
        });
      }

      const { conversationId } = result.data;
      const room = `conversation:${conversationId}`;

      // The user must have joined this conversation
      if (!socket.rooms.has(room)) {
        return reply({
          success: false,
          message: "Join the conversation first",
        });
      }

      try {
        const receipts = await markConversationMessagesRead({
          conversationId,
          userId: socket.data.user.id,
        });

        if (receipts.length > 0) {
          io.to(room).emit("messages:read", {
            conversationId,
            userId: socket.data.user.id,
            messageIds: receipts.map((receipt) => receipt.message_id),
            readAt: receipts[0].read_at,
          });
        }

        return reply({
          success: true,
          message: "Conversation messages marked as read",
          data: {
            updatedCount: receipts.length,
          },
        });
      } catch (error) {
        logger.error(
          { error, conversationId },
          "Failed to mark conversation messages as read",
        );

        return reply({
          success: false,
          message: "Unable to mark messages as read",
        });
      }
    });

    socket.on("disconnect", async (reason) => {
      const becameOffline = removeUserConnection(userId, socket.id);

      logger.info(
        {
          socketId: socket.id,
          userId,
          reason,
          activeConnections: activeConnections.get(userId)?.size || 0,
        },
        "Socket Disconnected",
      );
      // Another device is still connected
      if (!becameOffline) return;

      try {
        const result = await updateUserLastSeen(userId);
        const lastSeenAt = result?.last_seen_at || null;

        io.emit("presence:update", {
          userId,
          status: "offline",
          lastSeenAt,
        });

        logger.info({ userId, lastSeenAt }, "User went offline");
      } catch (error) {
        logger.error({ error, userId }, "Failed to update user last seen");
      }
    });
  });

  return io;
}
