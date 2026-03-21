export interface DiscordConfig {
  webhookUrl: string;
  username?: string;
  avatarUrl?: string;
  channels: {
    status?: string;
    alerts?: string;
    logs?: string;
  };
  timeoutMs?: number;
  retryAttempts?: number;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  timestamp?: string;
  footer?: {
    text: string;
    icon_url?: string;
  };
  image?: {
    url: string;
  };
  thumbnail?: {
    url: string;
  };
  author?: {
    name: string;
    url?: string;
    icon_url?: string;
  };
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
}

export interface DiscordMessage {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: DiscordEmbed[];
  tts?: boolean;
}

// Color constants
export const DiscordColors = {
  SUCCESS: 0x10b981, // emerald-500
  ERROR: 0xef4444, // red-500
  WARNING: 0xf59e0b, // amber-500
  INFO: 0x3b82f6, // blue-500
  PRIMARY: 0x6366f1, // indigo-500
  SECONDARY: 0x64748b, // slate-500
};
