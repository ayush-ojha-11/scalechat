export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable("refresh_tokens", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    user_id: {
      type: "uuid",
      notNull: true,
      references: '"users"',
      onDelete: "cascade",
    },
    family_id: {
      type: "uuid",
      notNull: true,
    },
    token_hash: {
      type: "varchar(64)",
      notNull: true,
      unique: true,
    },
    expires_at: {
      type: "timestamptz",
      notNull: true,
    },
    revoked_at: {
      type: "timestamptz",
    },
    replaced_by_token_id: {
      type: "uuid",
      references: '"refresh_tokens"',
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  pgm.createIndex("refresh_tokens", "user_id");
  pgm.createIndex("refresh_tokens", "family_id");
};

export const down = (pgm) => {
  pgm.dropTable("refresh_tokens");
};
