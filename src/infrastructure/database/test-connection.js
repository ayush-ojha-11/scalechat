import { pool } from "./index.js";

try {
  const result = await pool.query("SELECT NOW() AS current_time");
  console.log("Database connected successfully!");
  console.log("Query result:", result.rows[0]);
} catch (error) {
  console.error("Database connection failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
