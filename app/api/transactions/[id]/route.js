import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../lib/db';

export async function DELETE(req, { params }) {
  await ensureSchema();
  await sql`DELETE FROM transactions WHERE id = ${params.id}`;
  return NextResponse.json({ ok: true });
}
