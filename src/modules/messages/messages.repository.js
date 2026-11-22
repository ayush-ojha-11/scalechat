import { pool } from "../../infrastructure/database/index.js";

export async function isConversationParticipant({ conversationId, userId }) {
  const result = await pool.query(
    `
        SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2 LIMIT 1
        `,
    [conversationId, userId],
  );

  return result.rowCount > 0;
}

export async function createMessage({ conversationId, senderId, content }) {
  const result = await pool.query(
    `
        INSERT INTO messages (
        conversation_id,
        sender_id,
        content) VALUES ($1, $2, $3)
        RETURNING
        id,
        conversation_id,
        sender_id,
        content,
        created_at,
        updated_at
        `,
    [conversationId, senderId, content],
  );

  return result.rows[0];
}

export async function getConversationMessages({
  conversationId,
  cursor,
  limit,
}) {
  const result = await pool.query(
    `
    SELECT 
        id,
        conversation_id,
        sender_id,
        content,
        created_at,
        updated_at
      FROM messages
      WHERE conversation_id = $1
        AND (
          $2::timestamptz IS NULL
          OR (created_at, id) < ($2::timestamptz, $3::uuid)
        )
      ORDER BY created_at DESC, id DESC
      LIMIT $4
    `,
    [
      conversationId,
      cursor?.createdAt ?? null,
      cursor?.messageId ?? null,
      limit + 1,
    ],
  );

  const hasMore = result.rows.length > limit;
  const messages = result.rows.slice(0, limit);
  // Return messages in chronological order.
  messages.reverse();

  return {
    messages,
    hasMore,
  };
}
