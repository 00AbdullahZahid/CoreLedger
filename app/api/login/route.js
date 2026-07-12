import { NextResponse } from 'next/server';
import { COOKIE_NAME, expectedToken } from '../../../lib/auth';

export async function POST(req) {
  const { password } = await req.json();
  if (password !== (process.env.ADMIN_PASSWORD || 'changeme123')) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, await expectedToken(), {
    httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/',
  });
  return res;
}
