import { AppError } from "../../shared/errors/app-error.js";

import {
  isConversationParticipant,
  createMessage,
} from "./messages.repository.js";

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
