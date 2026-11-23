import { pool } from "../../infrastructure/database/index.js";

export async function findUserById(userId) {
  const query = `
    SELECT id, username, email, created_at FROM users WHERE id = $1 LIMIT 1
    `;
  const result = await pool.query(query, [userId]);

  return result.rows[0] ?? null;
}
export async function searchUsers({ query, limit, currentUserId }) {
  const result = await pool.query(
    `
      SELECT
        id,
        username,
        created_at
      FROM users
      WHERE id <> $1
        AND username ILIKE $2
      ORDER BY username ASC
      LIMIT $3
    `,
    [currentUserId, `${query}%`, limit],
  );

  return result.rows;
}
export async function findPublicUserById(userId) {
  const result = await pool.query(
    `
      SELECT
        id,
        username,
        created_at
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [userId],
  );

  return result.rows[0] || null;
}
