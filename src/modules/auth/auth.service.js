import bcrypt from "bcryptjs";

import {
  findUserByEmail,
  findUserByUsername,
  createUser,
} from "./auth.repository.js";

import { AppError } from "../../shared/errors/app-error.js";
import { generateAccessToken } from "../../shared/utils/jwt.js";
import {
  generateRefreshToken,
  hashRefreshToken,
  generateTokenFamilyId,
  getRefreshTokenExpiry,
} from "../../shared/utils/refresh-token.js";

import {
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} from "./refresh-token.repository.js";

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

export async function loginUser({ email, password }) {
  const user = await findUserByEmail(email);

  // Use the same message for both cases to avoid revealing
  // whether an email address is registered
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  const accessToken = generateAccessToken(user);

  const refreshToken = generateRefreshToken();

  const familyId = generateTokenFamilyId();

  await createRefreshToken({
    userId: user.id,
    familyId,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: getRefreshTokenExpiry(),
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    accessToken,
    refreshToken,
  };
}

export async function refreshAccessToken(token) {
  if (!token) {
    throw new AppError("Refresh token is required", 400);
  }

  const newRefreshToken = generateRefreshToken();

  const result = await rotateRefreshToken({
    oldTokenHash: hashRefreshToken(token),
    newTokenHash: hashRefreshToken(newRefreshToken),
    newExpiresAt: getRefreshTokenExpiry(),
  });

  if (result.status === "reuse_detected") {
    throw new AppError("Session expired. Please log in again.", 401);
  }
  if (result.status !== "rotated") {
    throw new AppError("Invalid or expired refresh token", 401);
  }
  const accessToken = generateAccessToken(result.user);

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logoutUser(token) {
  if (!token) {
    throw new AppError("Refresh token is required", 400);
  }

  await revokeRefreshToken(hashRefreshToken(token));

  return true;
}
