export function encodeCursor(data) {
  return Buffer.from(JSON.stringify(data)).toString("base64url");
}

export function decodeCursor(cursor) {
  if (!cursor) return null;

  try {
    const decoded = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf-8"),
    );

    if (
      typeof decoded.lastActivityAt !== "string" ||
      Number.isNaN(Date.parse(decoded.lastActivityAt)) ||
      typeof decoded.conversationId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        decoded.conversationId,
      )
    ) {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

export function encodeMessageCursor(data) {
  return encodeCursor(data);
}

export function decodeMessageCursor(cursor) {
  if (!cursor) return null;

  try {
    const decoded = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    );

    const validUUID =
      typeof decoded.messageId === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        decoded.messageId,
      );

    const validDate =
      typeof decoded.createdAt === "string" &&
      !Number.isNaN(Date.parse(decoded.createdAt));

    if (!validUUID || !validDate) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}
