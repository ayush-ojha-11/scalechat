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
