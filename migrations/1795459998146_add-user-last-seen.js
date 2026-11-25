export const up = (pgm) => {
  pgm.addColumn("users", {
    last_seen_at: {
      type: "timestamptz",
      notNull: false,
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumn("users", "last_seen_at");
};
