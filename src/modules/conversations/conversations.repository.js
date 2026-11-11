import { pool } from "../../infrastructure/database/index.js";

export async function findUserById(userId) {
  const result = await pool.query(
    `SELECT id FROM users WHERE id = $1 LIMIT 1`,
    [userId],
  );

  return result.rows[0] ?? null;
}

export async function findOrCreateDirectConversation({
  currentUserId,
  targetUserId,
}) {
  // Normalization - This ensures A-B and B-A produce same result
  const [userLowId, userhighId] = [currentUserId, targetUserId].sort();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Create a conversation only if this pair doesn't exist
    const insertResult = await client.query(
      `INSERT INTO conversations (type, created_by, direct_user_low_id, direct_user_high_id) VALUES ('direct', $1, $2, $3) ON CONFLICT (direct_user_low_id, direct_user_high_id) WHERE type = 'direct' DO NOTHING RETURNING id, type, created_at, created_by`,
      [currentUserId, userLowId, userhighId],
    );

    let conversation = insertResult.rows[0];
    // If another request already created it, retrieve it.
    if (!conversation) {
      const existingResult = await client.query(
        `SELECT id, type, created_at, created_by FROM conversations WHERE type = 'direct' AND direct_user_low_id = $1 AND direct_user_high_id = $2 LIMIT 1`,
        [userLowId, userhighId],
      );
      conversation = existingResult.rows[0];
    }

    if (!conversation) {
      throw new Error("Unable to create or retrieve conversation");
    }

    // Ensure both participants exist in the conversation
    await client.query(
      `
        INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2), ($1, $3) ON CONFLICT (conversation_id, user_id) DO NOTHING
        `,
      [conversation.id, userLowId, userhighId],
    );

    await client.query("COMMIT");
    return conversation;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
