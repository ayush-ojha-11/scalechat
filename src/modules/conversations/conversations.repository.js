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

export async function findUserConversations({ userId, cursor, limit }) {
  const query = ` SELECT
      c.id,
      c.type,
      c.created_at,
      c.created_by,

      COALESCE(
        latest_message.created_at,
        c.updated_at,
        c.created_at
      ) AS last_activity_at,

      participants.users AS participants,

      latest_message.id AS last_message_id,
      latest_message.content AS last_message_content,
      latest_message.sender_id AS last_message_sender_id,
      latest_message.created_at AS last_message_created_at

    FROM conversations c

    INNER JOIN conversation_participants current_participant
      ON current_participant.conversation_id = c.id
      AND current_participant.user_id = $1

    LEFT JOIN LATERAL (
      SELECT
        m.id,
        m.content,
        m.sender_id,
        m.created_at
      FROM messages m
      WHERE m.conversation_id = c.id
      ORDER BY m.created_at DESC, m.id DESC
      LIMIT 1
    ) latest_message ON TRUE

    LEFT JOIN LATERAL (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', u.id,
          'username', u.username
        )
      ) AS users
      FROM conversation_participants cp
      INNER JOIN users u ON u.id = cp.user_id
      WHERE cp.conversation_id = c.id
        AND cp.user_id != $1
    ) participants ON TRUE

    WHERE
      (
        $2::timestamptz IS NULL
        OR (
          COALESCE(
            latest_message.created_at,
            c.updated_at,
            c.created_at
          ),
          c.id
        ) < ($2::timestamptz, $3::uuid)
      )

    ORDER BY last_activity_at DESC, c.id DESC
    LIMIT $4`;

  const result = await pool.query(query, [
    userId,
    cursor?.lastActivityAt ?? null,
    cursor?.conversationId ?? null,
    limit + 1,
  ]);

  const hasMore = result.rows.length > limit;
  const conversations = result.rows.slice(0, limit);

  return {
    conversations,
    hasMore,
  };
}
