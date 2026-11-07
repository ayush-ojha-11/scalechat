import { pool } from "../../infrastructure/database/index.js";

export async function findUserById(userId) {
  const query = `
    SELECT id, username, email, created_at FROM users WHERE id = $1 LIMIT 1
    `;
  const result = await pool.query(query, [userId]);

  return result.rows[0] ?? null;
}
