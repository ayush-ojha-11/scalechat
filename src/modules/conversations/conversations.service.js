import { AppError } from "../../shared/errors/app-error.js";
import {
  findUserById,
  findOrCreateDirectConversation,
  findUserConversations,
} from "./conversations.repository.js";

import { encodeCursor, decodeCursor } from "../../shared/utils/pagination.js";

export async function createDirectConversation({
  currentUserId,
  targetUserId,
}) {
  // a user cannot create a conversation with themselves
  if (currentUserId === targetUserId) {
    throw new AppError("You cannot create a conversation with yourself", 400);
  }

  // verify that the target user exists
  const targetUser = await findUserById(targetUserId);

  if (!targetUser) {
    throw new AppError("Target user not found!", 404);
  }

  return findOrCreateDirectConversation({ currentUserId, targetUserId });
}

export async function getUserConversations({
  userId,
  limit,
  cursor: rawCursor,
}) {
  const cursor = decodeCursor(rawCursor);

  if (rawCursor && !cursor) {
    throw new AppError("Invalid pagination cursor", 400);
  }

  const result = await findUserConversations({
    userId,
    cursor,
    limit,
  });

  const lastConversation =
    result.conversations[result.conversations.length - 1];

  const nextCursor =
    result.hasMore && lastConversation
      ? encodeCursor({
          lastActivityAt: lastConversation.last_activity_at,
          conversationId: lastConversation.id,
        })
      : null;

  return {
    conversations: result.conversations,
    pagination: {
      limit,
      hasMore: result.hasMore,
      nextCursor,
    },
  };
}
