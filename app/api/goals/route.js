import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  await ensureSchema();
  const rows = await sql`SELECT * FROM goals ORDER BY created_at ASC`;
  return NextResponse.json(rows);
}

export async function PUT(req) {
  await ensureSchema();
  const { id, name, target } = await req.json();
  const rows = await sql`
    UPDATE goals SET name = ${name}, target = ${target} WHERE id = ${id} RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
