export const shorthands = undefined;

export const up = (pgm) => {
  // Store the canonical pair for direct conversations.
  pgm.sql(`
    ALTER TABLE conversations
    ADD COLUMN direct_user_low_id UUID,
    ADD COLUMN direct_user_high_id UUID;
  `);

  // Both users must exist.
  pgm.sql(`
    ALTER TABLE conversations
    ADD CONSTRAINT fk_conversations_direct_user_low
    FOREIGN KEY (direct_user_low_id)
    REFERENCES users(id)
    ON DELETE RESTRICT;
  `);

  pgm.sql(`
    ALTER TABLE conversations
    ADD CONSTRAINT fk_conversations_direct_user_high
    FOREIGN KEY (direct_user_high_id)
    REFERENCES users(id)
    ON DELETE RESTRICT;
  `);

  // Direct conversations require two different, ordered users.
  // Group conversations must not have these direct-user columns populated.
  pgm.sql(`
    ALTER TABLE conversations
    ADD CONSTRAINT chk_conversations_direct_users
    CHECK (
      (
        type = 'direct'
        AND direct_user_low_id IS NOT NULL
        AND direct_user_high_id IS NOT NULL
        AND direct_user_low_id < direct_user_high_id
      )
      OR
      (
        type = 'group'
        AND direct_user_low_id IS NULL
        AND direct_user_high_id IS NULL
      )
    );
  `);

  // Only one direct conversation can exist for a user pair.
  pgm.sql(`
    CREATE UNIQUE INDEX idx_conversations_direct_pair
    ON conversations (direct_user_low_id, direct_user_high_id)
    WHERE type = 'direct';
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_conversations_direct_pair;
  `);

  pgm.sql(`
    ALTER TABLE conversations
    DROP CONSTRAINT IF EXISTS chk_conversations_direct_users,
    DROP CONSTRAINT IF EXISTS fk_conversations_direct_user_high,
    DROP CONSTRAINT IF EXISTS fk_conversations_direct_user_low,
    DROP COLUMN IF EXISTS direct_user_high_id,
    DROP COLUMN IF EXISTS direct_user_low_id;
  `);
};
