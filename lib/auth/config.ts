export interface AuthConfig {
  enabled: boolean;
  mode: 'local' | 'jwt' | 'oauth';
  secretKey: string;
  sessionDuration: number;
  allowedUsers?: string[];
}

// Default auth configuration
export const defaultAuthConfig: AuthConfig = {
  enabled: process.env.AUTH_ENABLED === 'true',
  mode: (process.env.AUTH_MODE as AuthConfig['mode']) || 'local',
  secretKey: process.env.AUTH_SECRET_KEY || 'mission-control-default-secret-key-change-in-production',
  sessionDuration: parseInt(process.env.AUTH_SESSION_DURATION || '86400', 10), // 24 hours
  allowedUsers: process.env.AUTH_ALLOWED_USERS?.split(',') || ['chief-architect'],
};

// Get current auth config
export function getAuthConfig(): AuthConfig {
  return defaultAuthConfig;
}
