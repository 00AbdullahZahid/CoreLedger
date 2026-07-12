import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../lib/db';

export async function GET() {
  await ensureSchema();
  const rows = await sql`SELECT * FROM transactions ORDER BY date DESC, created_at DESC`;
  return NextResponse.json(rows);
}

export async function POST(req) {
  await ensureSchema();
  const { type, amount, category, note, date } = await req.json();
  if (!type || !amount || !category || !date)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const rows = await sql`
    INSERT INTO transactions (type, amount, category, note, date)
    VALUES (${type}, ${amount}, ${category}, ${note || ''}, ${date})
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
