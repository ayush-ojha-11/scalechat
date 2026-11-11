import { AppError } from "../../shared/errors/app-error.js";
import {
  findUserById,
  findOrCreateDirectConversation,
} from "./conversations.repository.js";

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
