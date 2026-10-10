import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '../migrations');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const { rows } = await pool.query('SELECT current_database() AS db');
console.log('db:', rows[0].db);
console.log('host:', new URL(process.env.DATABASE_URL).host);
console.log('migrations found:', fs.readdirSync(dir));

await pool.query(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);

const done = new Set(
  (await pool.query('SELECT name FROM schema_migrations')).rows.map(r => r.name)
);

for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort()) {
  if (done.has(file)) continue;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(fs.readFileSync(path.join(dir, file), 'utf8'));
    await client.query('INSERT INTO schema_migrations(name) VALUES ($1)', [file]);
    await client.query('COMMIT');
    console.log('applied', file);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('failed', file, e.message);
    process.exitCode = 1;
    break;
  } finally {
    client.release();
  }
}

await pool.end();