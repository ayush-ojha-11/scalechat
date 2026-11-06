import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN,
      issuer: "scalechat-api",
      audience: "scalechat-client",
    },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET, {
    issuer: "scalechat-api",
    audience: "scalechat-client",
  });
}
