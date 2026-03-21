import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { AuthConfig, getAuthConfig } from './config';

// Simple password-based auth for Chief Architect
const CHIEF_ARCHITECT_PASSWORD = process.env.CHIEF_ARCHITECT_PASSWORD || 'admin';

export interface Session {
  userId: string;
  username: string;
  role: 'admin' | 'user';
  expiresAt: number;
}

// Create a new session
export async function createSession(
  username: string,
  password: string
): Promise<Session | null> {
  const config = getAuthConfig();

  // Check if user is allowed
  if (config.allowedUsers && !config.allowedUsers.includes(username)) {
    return null;
  }

  // Verify password (simple local auth)
  if (username === 'chief-architect' && password !== CHIEF_ARCHITECT_PASSWORD) {
    return null;
  }

  // For demo purposes, accept any username with matching password pattern
  // In production, this should use proper password hashing
  if (username !== 'chief-architect' && password !== CHIEF_ARCHITECT_PASSWORD) {
    return null;
  }

  const expiresAt = Date.now() + config.sessionDuration * 1000;

  const session: Session = {
    userId: `user-${Date.now()}`,
    username,
    role: username === 'chief-architect' ? 'admin' : 'user',
    expiresAt,
  };

  return session;
}

// Sign session into JWT
export async function signSession(session: Session): Promise<string> {
  const config = getAuthConfig();
  const secret = new TextEncoder().encode(config.secretKey);

  const token = await new SignJWT({
    userId: session.userId,
    username: session.username,
    role: session.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(session.expiresAt / 1000))
    .sign(secret);

  return token;
}

// Verify and decode session from token
export async function verifySession(token: string): Promise<Session | null> {
  const config = getAuthConfig();
  const secret = new TextEncoder().encode(config.secretKey);

  try {
    const { payload } = await jwtVerify(token, secret);

    if (!payload.exp || Date.now() >= payload.exp * 1000) {
      return null;
    }

    return {
      userId: payload.userId as string,
      username: payload.username as string,
      role: payload.role as 'admin' | 'user',
      expiresAt: payload.exp * 1000,
    };
  } catch {
    return null;
  }
}

// Get session from request cookies
export async function getSessionFromRequest(request: Request): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) {
    return null;
  }

  return verifySession(token);
}

// Check if request is authenticated
export async function isAuthenticated(request: Request): Promise<boolean> {
  const config = getAuthConfig();

  if (!config.enabled) {
    return true;
  }

  const session = await getSessionFromRequest(request);
  return session !== null;
}

// Require authentication - throws if not authenticated
export async function requireAuth(request: Request): Promise<Session> {
  const config = getAuthConfig();

  if (!config.enabled) {
    return {
      userId: 'system',
      username: 'system',
      role: 'admin',
      expiresAt: Date.now() + 86400000,
    };
  }

  const session = await getSessionFromRequest(request);

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}

// Set session cookie
export async function setSessionCookie(token: string, maxAge: number): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/',
  });
}

// Clear session cookie
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}
