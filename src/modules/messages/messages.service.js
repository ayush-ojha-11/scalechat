import { AppError } from "../../shared/errors/app-error.js";

import {
  isConversationParticipant,
  createMessage,
  getConversationMessages,
} from "./messages.repository.js";

import {
  decodeMessageCursor,
  encodeMessageCursor,
} from "../../shared/utils/pagination.js";

export async function sendMessage({ conversationId, senderId, content }) {
  // Check whether sender belongs to the conversation or not

  const isParticipant = await isConversationParticipant({
    conversationId,
    userId: senderId,
  });

  if (!isParticipant) {
    throw new AppError(`Conversation not found`, 404);
  }

  // save the message
  const message = await createMessage({ conversationId, senderId, content });
  return message;
}

export async function getMessages({
  conversationId,
  userId,
  limit,
  cursor: rawCursor,
}) {
  // Decode the cursor
  const cursor = decodeMessageCursor(rawCursor);

  if (rawCursor && !cursor) {
    throw new AppError("Invalid pagination cursor", 400);
  }
  // Check conversation membership
  const isParticipant = await isConversationParticipant({
    conversationId,
    userId,
  });

  if (!isParticipant) {
    throw new AppError("Conversation not found", 404);
  }

  // fetch messages
  const result = await getConversationMessages({
    conversationId,
    cursor,
    limit,
  });

  // Generate cursor using the oldest returned message
  const oldestMessage = result.messages[0];

  const nextCursor =
    result.hasMore && oldestMessage
      ? encodeMessageCursor({
          createdAt: oldestMessage.created_at,
          messageId: oldestMessage.id,
        })
      : null;

  return {
    messages: result.messages,
    pagination: {
      limit,
      hasMore: result.hasMore,
      nextCursor,
    },
  };
}
