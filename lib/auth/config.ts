export interface AuthConfig {
  enabled: boolean;
  mode: 'local' | 'jwt' | 'oauth';
  secretKey: string;
  sessionDuration: number;
  allowedUsers?: string[];
}

function resolveSecretKey(): string {
  const key = process.env.AUTH_SECRET_KEY;
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'AUTH_SECRET_KEY environment variable must be set in production. ' +
        'Generate one with: openssl rand -base64 32'
      );
    }
    console.warn('[auth] WARNING: AUTH_SECRET_KEY is not set — using insecure dev default.');
    return 'mission-control-default-secret-key-change-in-production';
  }
  return key;
}

export const defaultAuthConfig: AuthConfig = {
  enabled: process.env.AUTH_ENABLED === 'true',
  mode: (process.env.AUTH_MODE as AuthConfig['mode']) || 'local',
  secretKey: resolveSecretKey(),
  sessionDuration: parseInt(process.env.AUTH_SESSION_DURATION || '86400', 10),
  allowedUsers: process.env.AUTH_ALLOWED_USERS?.split(',') || ['chief-architect'],
};

export function getAuthConfig(): AuthConfig {
  return defaultAuthConfig;
}
