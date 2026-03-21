import { NextRequest, NextResponse } from 'next/server';
import { createSession, signSession, setSessionCookie } from '@/lib/auth/local';
import { getAuthConfig } from '@/lib/auth/config';
import { auditLogger } from '@/lib/audit';

// POST /api/auth/login - Authenticate user
export async function POST(request: NextRequest) {
  try {
    const config = getAuthConfig();
    
    // If auth is disabled, return success
    if (!config.enabled) {
      return NextResponse.json({ success: true, message: 'Authentication disabled' });
    }

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Create session
    const session = await createSession(username, password);

    if (!session) {
      // Log failed login
      auditLogger.logLogin(username, false, {
        ip: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Sign and set session cookie
    const token = await signSession(session);
    await setSessionCookie(token, config.sessionDuration);

    // Log successful login
    auditLogger.logLogin(username, true, {
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      user: {
        username: session.username,
        role: session.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
