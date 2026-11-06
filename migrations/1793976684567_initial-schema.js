/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Create the initial ScaleChat database schema.
 * IF NOT EXISTS allows this migration to run against our
 * existing local database without recreating existing tables.
 *
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const up = (pgm) => {
  // 1. Users
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(50) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  pgm.sql(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username
    ON users (LOWER(username));
  `);

  // 2. Conversations
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type VARCHAR(20) NOT NULL CHECK (type IN ('direct', 'group')),
      created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_conversations_created_by
    ON conversations (created_by);
  `);

  // 3. Conversation participants
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS conversation_participants (
      conversation_id UUID NOT NULL
        REFERENCES conversations(id) ON DELETE CASCADE,
      user_id UUID NOT NULL
        REFERENCES users(id) ON DELETE RESTRICT,
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (conversation_id, user_id)
    );
  `);

  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id
    ON conversation_participants (user_id, conversation_id);
  `);

  // 4. Messages
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL
        REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id UUID NOT NULL
        REFERENCES users(id) ON DELETE RESTRICT,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CHECK (LENGTH(TRIM(content)) > 0)
    );
  `);

  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
    ON messages (conversation_id, created_at DESC, id DESC);
  `);
};

/**
 * Roll back the initial schema.
 *
 * WARNING: This drops all four tables and their data.
 *
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const down = (pgm) => {
  pgm.sql("DROP TABLE IF EXISTS messages;");
  pgm.sql("DROP TABLE IF EXISTS conversation_participants;");
  pgm.sql("DROP TABLE IF EXISTS conversations;");
  pgm.sql("DROP TABLE IF EXISTS users;");
};
