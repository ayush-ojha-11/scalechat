import pg from "pg";

import { env } from "../../config/env.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,

  // Maximum connections maintained by this application instance
  max: 10,

  // Close idle connections after 30 seconds
  idleTimeoutMillis: 30000,

  // Wait maximum 5 seconds to establish a connection
  connectionTimeoutMillis: 5000,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error);
});
