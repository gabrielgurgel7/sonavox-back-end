import { Pool } from "pg";

let pool: Pool;

export function getPool(): Pool {
  if (!pool) {
    pool = process.env.DATABASE_URL
      ? new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
        })
      : new Pool({
          host: process.env.DB_HOST || "localhost",
          port: Number(process.env.DB_PORT) || 5432,
          database: process.env.DB_NAME || "ecommerce_db",
          user: process.env.DB_USER || "postgres",
          password: process.env.DB_PASSWORD || "postgres",
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        });

    pool.on("error", (err) => {
      console.error("Unexpected error on idle client", err);
    });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) await pool.end();
}
