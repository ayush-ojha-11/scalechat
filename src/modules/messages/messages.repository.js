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
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Save the message
    const messageResult = await client.query(
      `
       INSERT INTO messages (
          conversation_id,
          sender_id,
          content
        )
        VALUES ($1, $2, $3)
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

    const message = messageResult.rows[0];

    // 2. create receipt record for participants of conversation
    await client.query(
      `
      INSERT INTO message_receipts (
          message_id,
          user_id
        )
        SELECT $1, cp.user_id
        FROM conversation_participants cp
        WHERE cp.conversation_id = $2
          AND cp.user_id <> $3
        `,
      [message.id, conversationId, senderId],
    );

    await client.query("COMMIT");
    return message;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
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

export async function markMessageDelivered({ messageId, userId }) {
  const result = await pool.query(
    `
     UPDATE message_receipts mr
      SET delivered_at = NOW()
      FROM messages m
      WHERE mr.message_id = $1
        AND mr.user_id = $2
        AND mr.delivered_at IS NULL
        AND m.id = mr.message_id
      RETURNING
        mr.message_id,
        mr.user_id,
        mr.delivered_at,
        m.conversation_id
    `,
    [messageId, userId],
  );

  return result.rows[0] || null;
}

export async function markConversationMessagesRead({ conversationId, userId }) {
  const result = await pool.query(
    `
  UPDATE message_receipts mr
      SET
        delivered_at = COALESCE(mr.delivered_at, NOW()),
        read_at = NOW()
      FROM messages m
      WHERE mr.message_id = m.id
        AND m.conversation_id = $1
        AND mr.user_id = $2
        AND mr.read_at IS NULL
      RETURNING
        mr.message_id,
        mr.user_id,
        mr.read_at,
        m.sender_id,
        m.conversation_id
  `,
    [conversationId, userId],
  );

  return result.rows;
}

export async function getMessagesAfter({ conversationId, after, limit }) {
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
       AND (created_at, id) > ($2::timestamptz, $3::uuid)
     ORDER BY created_at ASC, id ASC
     LIMIT $4
    `,
    [conversationId, after.createdAt, after.messageId, limit],
  );

  const hasMore = result.rows.length > limit;
  const messages = result.rows.slice(0, limit);

  return {
    messages,
    hasMore,
  };
}
