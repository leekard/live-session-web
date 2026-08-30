import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import { pool } from './pool.js';
import { config } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, 'migrations');

async function ensureTable(client: pg.PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await ensureTable(client);

    const files = (await readFile(migrationsDir + '/list.txt', 'utf-8')).split('\n').map((s) => s.trim()).filter(Boolean);
    for (const file of files) {
      const applied = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [file]);
      if ((applied.rowCount ?? 0) > 0) continue;

      const sql = await readFile(path.join(migrationsDir, file), 'utf-8');
      await client.query(sql, getParams(file));
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      console.log(`Applied migration: ${file}`);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Per-file parameters (seed admin uses bcrypt hash).
function getParams(file: string): string[] {
  if (file.startsWith('002_seed_admin')) {
    const hash = bcrypt.hashSync(config.adminPassword, 10);
    return [config.adminEmail, hash];
  }
  return [];
}

// Allow running directly: node dist/db/migrate.js
const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirect) {
  runMigrations().then(() => pool.end()).catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}
