import 'dotenv/config';
import { getPool } from '../connection';
import { migrations } from './schema';

async function runMigrations() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(255) PRIMARY KEY,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    for (const migration of migrations) {
      const { rows } = await client.query(
        'SELECT name FROM schema_migrations WHERE name = $1',
        [migration.name],
      );

      if (rows.length === 0) {
        console.log(`Running migration: ${migration.name}`);
        await client.query('BEGIN');
        try {
          await client.query(migration.up);
          await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [migration.name]);
          await client.query('COMMIT');
          console.log(`✓ ${migration.name}`);
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        }
      } else {
        console.log(`Skipping ${migration.name} (already executed)`);
      }
    }

    console.log('\nAll migrations completed!');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(console.error);
