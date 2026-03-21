import { DiscordConfig, DiscordEmbed, DiscordColors } from './config';

// Webhook payload builder
export function buildWebhookPayload(options: {
  content?: string;
  username?: string;
  avatarUrl?: string;
  embeds?: DiscordEmbed[];
}): {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: DiscordEmbed[];
} {
  return {
    content: options.content,
    username: options.username,
    avatar_url: options.avatarUrl,
    embeds: options.embeds,
  };
}

// Rich embed builder
export function buildEmbed(options: {
  title?: string;
  description?: string;
  color?: number;
  url?: string;
  timestamp?: Date;
  footer?: { text: string; iconUrl?: string };
  image?: { url: string };
  thumbnail?: { url: string };
  author?: { name: string; url?: string; iconUrl?: string };
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
}): DiscordEmbed {
  return {
    title: options.title,
    description: options.description,
    color: options.color,
    url: options.url,
    timestamp: options.timestamp?.toISOString(),
    footer: options.footer ? {
      text: options.footer.text,
      icon_url: options.footer.iconUrl,
    } : undefined,
    image: options.image,
    thumbnail: options.thumbnail,
    author: options.author ? {
      name: options.author.name,
      url: options.author.url,
      icon_url: options.author.iconUrl,
    } : undefined,
    fields: options.fields,
  };
}

// Retry logic for webhook calls
export async function postToWebhookWithRetry(
  webhookUrl: string,
  payload: unknown,
  options: {
    maxRetries?: number;
    timeoutMs?: number;
    onRetry?: (attempt: number, delay: number, error: Error) => void;
  } = {}
): Promise<void> {
  const { maxRetries = 3, timeoutMs = 10000, onRetry } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Discord API error: ${response.status} ${response.statusText}`);
      }

      return; // Success
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        // Exponential backoff with jitter
        const baseDelay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
        const jitter = Math.random() * 1000;
        const delay = baseDelay + jitter;

        if (onRetry) {
          onRetry(attempt, delay, lastError);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Webhook request failed after all retries');
}

// Validate webhook URL
export function isValidDiscordWebhook(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname === 'discord.com' &&
      parsed.pathname.startsWith('/api/webhooks/')
    );
  } catch {
    return false;
  }
}

// Preset embed templates
export const embedTemplates = {
  success: (title: string, description: string): DiscordEmbed => ({
    title: `✅ ${title}`,
    description,
    color: DiscordColors.SUCCESS,
    timestamp: new Date().toISOString(),
  }),

  error: (title: string, description: string): DiscordEmbed => ({
    title: `❌ ${title}`,
    description,
    color: DiscordColors.ERROR,
    timestamp: new Date().toISOString(),
  }),

  warning: (title: string, description: string): DiscordEmbed => ({
    title: `⚠️ ${title}`,
    description,
    color: DiscordColors.WARNING,
    timestamp: new Date().toISOString(),
  }),

  info: (title: string, description: string): DiscordEmbed => ({
    title: `ℹ️ ${title}`,
    description,
    color: DiscordColors.INFO,
    timestamp: new Date().toISOString(),
  }),

  workflowComplete: (options: {
    workflowName: string;
    runId: string;
    summary: string;
    duration: string;
    output?: Record<string, unknown>;
  }): DiscordEmbed => ({
    title: '✅ Workflow Completed',
    description: options.summary,
    color: DiscordColors.SUCCESS,
    timestamp: new Date().toISOString(),
    fields: [
      { name: 'Workflow', value: options.workflowName, inline: true },
      { name: 'Run ID', value: options.runId, inline: true },
      { name: 'Duration', value: options.duration, inline: true },
      ...(options.output && Object.keys(options.output).length > 0
        ? [{
            name: 'Output',
            value: '```json\n' + JSON.stringify(options.output, null, 2).slice(0, 1000) + '\n```',
            inline: false,
          }]
        : []),
    ],
    footer: { text: 'Mission Control' },
  }),

  workflowFailed: (options: {
    workflowName: string;
    runId: string;
    error: string;
    duration: string;
  }): DiscordEmbed => ({
    title: '❌ Workflow Failed',
    description: options.error,
    color: DiscordColors.ERROR,
    timestamp: new Date().toISOString(),
    fields: [
      { name: 'Workflow', value: options.workflowName, inline: true },
      { name: 'Run ID', value: options.runId, inline: true },
      { name: 'Duration', value: options.duration, inline: true },
    ],
    footer: { text: 'Mission Control' },
  }),
};
