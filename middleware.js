import { NextResponse } from 'next/server';
import { COOKIE_NAME, expectedToken } from './lib/auth';

export async function middleware(req) {
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (cookie === (await expectedToken())) return NextResponse.next();
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }
  return NextResponse.redirect(new URL('/login', req.url));
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/transactions/:path*', '/api/goals/:path*'],
};
