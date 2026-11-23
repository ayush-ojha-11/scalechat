export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable("message_receipts", {
    message_id: {
      type: "uuid",
      notNull: true,
      references: '"messages"',
      onDelete: "CASCADE",
    },

    user_id: {
      type: "uuid",
      notNull: true,
      references: '"users"',
      onDelete: "RESTRICT",
    },

    delivered_at: {
      type: "timestamptz",
    },

    read_at: {
      type: "timestamptz",
    },
  });

  pgm.addConstraint("message_receipts", "message_receipts_pkey", {
    primaryKey: ["message_id", "user_id"],
  });

  pgm.addConstraint(
    "message_receipts",
    "message_receipts_read_requires_delivery",
    {
      check: "read_at IS NULL OR delivered_at IS NOT NULL",
    },
  );

  pgm.createIndex("message_receipts", "user_id");
};

export const down = (pgm) => {
  pgm.dropTable("message_receipts");
};
