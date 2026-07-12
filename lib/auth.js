export const COOKIE_NAME = 'budget_session';

export async function expectedToken() {
  const secret = process.env.SESSION_SECRET || 'dev-secret';
  const password = process.env.ADMIN_PASSWORD || 'changeme123';
  const data = new TextEncoder().encode(secret + ':' + password);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
