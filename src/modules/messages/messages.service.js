import { AppError } from "../../shared/errors/app-error.js";

import {
  isConversationParticipant,
  createMessage,
  getConversationMessages,
  markMessageDelivered as markMessageDeliveredRepository,
  markConversationMessagesRead as markConversationMessagesReadRepository,
  getMessagesAfter,
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

export async function canAccessConversation({ conversationId, userId }) {
  return isConversationParticipant({ conversationId, userId });
}

export async function markMessageDelivered({ messageId, userId }) {
  return markMessageDeliveredRepository({ messageId, userId });
}

export async function markConversationMessagesRead({ conversationId, userId }) {
  return markConversationMessagesReadRepository({
    conversationId,
    userId,
  });
}

export async function syncMessages({
  conversationId,
  userId,
  after: rawCursor,
  limit,
}) {
  // A synchronization request must include its last known cursor
  if (!rawCursor) {
    throw new AppError("Synchronization cursor is required", 400);
  }
  const after = decodeMessageCursor(rawCursor);
  if (!after) {
    throw new AppError("Invalid synchronization cursor", 400);
  }
  // Never allow users to synchronize conversations
  // they are not members of
  const isParticipant = await isConversationParticipant({
    conversationId,
    userId,
  });
  if (!isParticipant) {
    throw new AppError("Conversation not found", 404);
  }
  const result = await getMessagesAfter({ conversationId, after, limit });
  const nextAfter = result.hasMore
    ? encodeMessageCursor({
        messageId: result.messages.at(-1).id,
        createdAt: result.messages.at(-1).created_at,
      })
    : null;

  return {
    messages: result.messages,
    hasMore: result.hasMore,
    nextAfter,
  };
}
