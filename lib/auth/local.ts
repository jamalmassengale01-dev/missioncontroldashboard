import { timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { getAuthConfig } from './config';

function resolvePassword(): string {
  const pw = process.env.CHIEF_ARCHITECT_PASSWORD;
  if (!pw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CHIEF_ARCHITECT_PASSWORD environment variable must be set in production.');
    }
    console.warn('[auth] WARNING: CHIEF_ARCHITECT_PASSWORD is not set — using insecure dev default.');
    return 'admin';
  }
  return pw;
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export interface Session {
  userId: string;
  username: string;
  role: 'admin' | 'user';
  expiresAt: number;
}

export async function createSession(username: string, password: string): Promise<Session | null> {
  const config = getAuthConfig();
  if (config.allowedUsers && !config.allowedUsers.includes(username)) return null;
  if (!safeCompare(password, resolvePassword())) return null;
  const expiresAt = Date.now() + config.sessionDuration * 1000;
  return { userId: `user-${Date.now()}`, username, role: username === 'chief-architect' ? 'admin' : 'user', expiresAt };
}

export async function signSession(session: Session): Promise<string> {
  const config = getAuthConfig();
  const secret = new TextEncoder().encode(config.secretKey);
  return new SignJWT({ userId: session.userId, username: session.username, role: session.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(session.expiresAt / 1000))
    .sign(secret);
}

export async function verifySession(token: string): Promise<Session | null> {
  const config = getAuthConfig();
  const secret = new TextEncoder().encode(config.secretKey);
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.exp || Date.now() >= payload.exp * 1000) return null;
    return { userId: payload.userId as string, username: payload.username as string, role: payload.role as 'admin' | 'user', expiresAt: payload.exp * 1000 };
  } catch { return null; }
}

export async function getSessionFromRequest(request: Request): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function isAuthenticated(request: Request): Promise<boolean> {
  const config = getAuthConfig();
  if (!config.enabled) return true;
  const session = await getSessionFromRequest(request);
  return session !== null;
}

export async function requireAuth(request: Request): Promise<Session> {
  const config = getAuthConfig();
  if (!config.enabled) return { userId: 'system', username: 'system', role: 'admin', expiresAt: Date.now() + 86400000 };
  const session = await getSessionFromRequest(request);
  if (!session) throw new Error('Unauthorized');
  return session;
}

export async function setSessionCookie(token: string, maxAge: number): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge, path: '/' });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}
