import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL);

let ready = false;

export async function ensureSchema() {
  if (ready) return;

  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id          SERIAL PRIMARY KEY,
      type        TEXT NOT NULL CHECK (type IN ('income','expense')),
      amount      NUMERIC(12,2) NOT NULL,
      category    TEXT NOT NULL,
      note        TEXT DEFAULT '',
      date        DATE NOT NULL,
      created_at  TIMESTAMP DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS goals (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      target      NUMERIC(12,2) NOT NULL,
      created_at  TIMESTAMP DEFAULT NOW()
    );
  `;

  // Seed default goal if none exist
  const existing = await sql`SELECT id FROM goals LIMIT 1`;
  if (existing.length === 0) {
    await sql`INSERT INTO goals (name, target) VALUES ('Honda CG 125 (Black)', 235000)`;
  }

  ready = true;
}
