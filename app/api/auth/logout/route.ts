import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, getSessionFromRequest } from '@/lib/auth/local';
import { auditLogger } from '@/lib/audit';

// POST /api/auth/logout - Logout user
export async function POST(request: NextRequest) {
  try {
    // Get current session for audit logging
    const session = await getSessionFromRequest(request);
    
    if (session) {
      auditLogger.logLogout(session.username, {
        ip: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    }

    // Clear session cookie
    await clearSessionCookie();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
