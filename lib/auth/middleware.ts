import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthConfig } from './config';
import { verifySession } from './local';

// Paths that require authentication
const PROTECTED_PATHS = [
  '/api/agents/',
  '/api/workflows',
  '/api/audit',
  '/api/approvals',
  '/api/retry',
  '/operations',
  '/architect',
];

// Paths that are always public
const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/_next',
  '/favicon.ico',
  '/api/health',
];

// Check if path should be protected
function isProtectedPath(pathname: string): boolean {
  // Always allow public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return false;
  }

  // Check if path matches protected patterns
  return PROTECTED_PATHS.some(path => pathname.startsWith(path));
}

// Middleware handler
export async function middleware(request: NextRequest) {
  const config = getAuthConfig();

  // If auth is disabled, allow all requests
  if (!config.enabled) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Check if this path should be protected
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  // Check for session token
  const token = request.cookies.get('session')?.value;

  if (!token) {
    // API routes return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Page routes redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token
  const session = await verifySession(token);

  if (!session) {
    // Clear invalid cookie
    const response = pathname.startsWith('/api/')
      ? NextResponse.json(
          { error: 'Unauthorized', message: 'Session expired' },
          { status: 401 }
        )
      : NextResponse.redirect(new URL('/login', request.url));

    response.cookies.delete('session');
    return response;
  }

  // Add session info to request headers for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', session.userId);
  requestHeaders.set('x-username', session.username);
  requestHeaders.set('x-user-role', session.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Configure middleware matcher
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/health).*)',
  ],
};
