import { AppError } from "../../shared/errors/app-error.js";
import {
  findUserById,
  searchUsers as searchUsersRepository,
  findPublicUserById,
  updateUserLastSeen as updateUserLastSeenRepository,
} from "./users.repository.js";

export async function getCurrentUser(userId) {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
}

export async function searchUsers({ query, limit, currentUserId }) {
  return searchUsersRepository({ query, limit, currentUserId });
}

export async function getPublicUserProfile(userId) {
  const user = await findPublicUserById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }
  return user;
}

export async function updateUserLastSeen(userId) {
  return updateUserLastSeenRepository(userId);
}
