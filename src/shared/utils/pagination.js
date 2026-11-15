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
