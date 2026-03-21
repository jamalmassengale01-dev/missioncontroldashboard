// Configuration service - loads and validates environment variables

export interface AppConfig {
  // Feature flags
  features: {
    enableTelegram: boolean;
    enableDiscord: boolean;
    enableSupabase: boolean;
    enableRedis: boolean;
    enableLLM: boolean;
  };

  // Telegram config
  telegram: {
    botToken: string;
    webhookUrl?: string;
    webhookSecret?: string;
    allowedUsers?: string[];
    pollingMode: boolean;
    pollingInterval: number;
  };

  // Discord config
  discord: {
    webhookUrl: string;
    username?: string;
    avatarUrl?: string;
    channels: {
      status?: string;
      alerts?: string;
      logs?: string;
    };
  };

  // Supabase config
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
  };

  // Redis config (for Bull queue)
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };

  // LLM configs
  llm: {
    openai?: {
      apiKey: string;
      model: string;
      baseUrl?: string;
    };
    anthropic?: {
      apiKey: string;
      model: string;
      baseUrl?: string;
    };
    kimi?: {
      apiKey: string;
      model: string;
      baseUrl?: string;
    };
    defaultProvider: 'openai' | 'anthropic' | 'kimi';
  };

  // App settings
  app: {
    name: string;
    version: string;
    environment: 'development' | 'production' | 'test';
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

// Parse comma-separated list
function parseList(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

// Load config from environment
export function loadConfig(): AppConfig {
  const config: AppConfig = {
    features: {
      enableTelegram: process.env.ENABLE_TELEGRAM === 'true',
      enableDiscord: process.env.ENABLE_DISCORD === 'true',
      enableSupabase: process.env.ENABLE_SUPABASE === 'true',
      enableRedis: process.env.ENABLE_REDIS === 'true',
      enableLLM: process.env.ENABLE_LLM === 'true',
    },

    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
      webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET,
      allowedUsers: parseList(process.env.TELEGRAM_ALLOWED_USERS),
      pollingMode: process.env.TELEGRAM_POLLING_MODE === 'true',
      pollingInterval: parseInt(process.env.TELEGRAM_POLLING_INTERVAL || '300', 10),
    },

    discord: {
      webhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
      username: process.env.DISCORD_USERNAME,
      avatarUrl: process.env.DISCORD_AVATAR_URL,
      channels: {
        status: process.env.DISCORD_STATUS_WEBHOOK,
        alerts: process.env.DISCORD_ALERTS_WEBHOOK,
        logs: process.env.DISCORD_LOGS_WEBHOOK,
      },
    },

    supabase: {
      url: process.env.SUPABASE_URL || '',
      anonKey: process.env.SUPABASE_ANON_KEY || '',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },

    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0', 10),
    },

    llm: {
      openai: process.env.OPENAI_API_KEY ? {
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        baseUrl: process.env.OPENAI_BASE_URL,
      } : undefined,
      anthropic: process.env.ANTHROPIC_API_KEY ? {
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
        baseUrl: process.env.ANTHROPIC_BASE_URL,
      } : undefined,
      kimi: process.env.KIMI_API_KEY ? {
        apiKey: process.env.KIMI_API_KEY,
        model: process.env.KIMI_MODEL || 'kimi-k2.5',
        baseUrl: process.env.KIMI_BASE_URL,
      } : undefined,
      defaultProvider: (process.env.LLM_DEFAULT_PROVIDER as 'openai' | 'anthropic' | 'kimi') || 'openai',
    },

    app: {
      name: process.env.APP_NAME || 'Mission Control',
      version: process.env.APP_VERSION || '0.1.0',
      environment: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
      logLevel: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
    },
  };

  return config;
}

// Validate required config
export function validateConfig(config: AppConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate Telegram if enabled
  if (config.features.enableTelegram) {
    if (!config.telegram.botToken) {
      errors.push('TELEGRAM_BOT_TOKEN is required when ENABLE_TELEGRAM is true');
    }
  }

  // Validate Discord if enabled
  if (config.features.enableDiscord) {
    if (!config.discord.webhookUrl) {
      errors.push('DISCORD_WEBHOOK_URL is required when ENABLE_DISCORD is true');
    }
  }

  // Validate Supabase if enabled
  if (config.features.enableSupabase) {
    if (!config.supabase.url) {
      errors.push('SUPABASE_URL is required when ENABLE_SUPABASE is true');
    }
    if (!config.supabase.anonKey) {
      errors.push('SUPABASE_ANON_KEY is required when ENABLE_SUPABASE is true');
    }
  }

  // Validate Redis if enabled
  if (config.features.enableRedis) {
    if (!config.redis.host) {
      errors.push('REDIS_HOST is required when ENABLE_REDIS is true');
    }
  }

  // Validate LLM if enabled
  if (config.features.enableLLM) {
    const hasProvider = config.llm.openai || config.llm.anthropic || config.llm.kimi;
    if (!hasProvider) {
      errors.push('At least one LLM provider (OPENAI_API_KEY, ANTHROPIC_API_KEY, or KIMI_API_KEY) is required when ENABLE_LLM is true');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Singleton config instance
let configInstance: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!configInstance) {
    configInstance = loadConfig();
  }
  return configInstance;
}

// Reset config (useful for testing)
export function resetConfig(): void {
  configInstance = null;
}
