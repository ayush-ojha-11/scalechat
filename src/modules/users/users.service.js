import { AppError } from "../../shared/errors/app-error.js";
import { findUserById } from "./users.repository.js";

export async function getCurrentUser(userId) {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
}
