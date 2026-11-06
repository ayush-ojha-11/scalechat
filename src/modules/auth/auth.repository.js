import { pool } from "../../infrastructure/database/index.js";

export async function findUserByEmail(email) {
  const query = `SELECT id, username, email, password_hash FROM users WHERE email = $1 LIMIT 1`;
  const result = await pool.query(query, [email]);

  return result.rows[0] ?? null;
}

export async function findUserByUsername(username) {
  const query = `SELECT id FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1`;
  const result = await pool.query(query, [username]);

  return result.rows[0] ?? null;
}

export async function createUser({ username, email, passwordHash }) {
  const query = `
    INSERT INTO users (username, email, password_hash)
    VALUES($1, $2, $3)
    RETURNING id, username, email, created_at`;

  const result = await pool.query(query, [username, email, passwordHash]);

  return result.rows[0];
}
