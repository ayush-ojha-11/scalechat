import bcrypt from "bcryptjs";

import {
  findUserByEmail,
  findUserByUsername,
  createUser,
} from "./auth.repository.js";

import { AppError } from "../../shared/errors/app-error.js";

const SALT_ROUNDS = 12;

export async function registerUser({ username, email, password }) {
  // 1. Check whether email is already registered
  const existingEmail = await findUserByEmail(email);

  if (existingEmail) {
    throw new AppError("Email is already registered", 409);
  }

  // 2. Check whether username already exists
  const existingUsername = await findUserByUsername(username);

  if (existingUsername) {
    throw new AppError("Username is already taken", 409);
  }

  //3. Hash the password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  //4. Create user
  try {
    const user = await createUser({ username, email, passwordHash });
    return user;
  } catch (error) {
    // Handle unique constraint violations.
    // Another request may have registered the same email
    // or username between our checks and INSERT.
    if (error.code === "23505") {
      throw new AppError("Email or username is already taken", 409);
    }
    throw error;
  }
}
