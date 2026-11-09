import { randomBytes, createHash, randomUUID } from "node:crypto";

export function generateRefreshToken() {
  return randomBytes(64).toString("base64url");
}

export function hashRefreshToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateTokenFamilyId() {
  return randomUUID();
}

export function getRefreshTokenExpiry() {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);

  return expiry;
}
