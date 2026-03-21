import { adapterRegistry } from '@/lib/adapters/registry';
import { TelegramAdapter } from '@/lib/adapters/telegram/adapter';
import { DiscordAdapter } from '@/lib/adapters/discord/adapter';
import { DiscordEmbed, DiscordColors } from '@/lib/adapters/discord/config';
import { getConfig } from './config';

// Re-export functions for backward compatibility
export { sendNotification as notify };
export { notifyWorkflowComplete as workflowCompleted };
export { notifyWorkflowFailed as workflowFailed };
export { sendSystemAlert as alert };

// Legacy notificationService object for backward compatibility
export const notificationService = {
  notify: sendNotification,
  workflowCompleted: notifyWorkflowComplete,
  workflowFailed: notifyWorkflowFailed,
  alert: sendSystemAlert,
};

export type NotificationChannel = 'telegram' | 'discord' | 'all';
export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';

export interface NotificationOptions {
  channel?: NotificationChannel;
  severity?: NotificationSeverity;
  title?: string;
  metadata?: Record<string, unknown>;
}

// Send a notification through configured channels
export async function sendNotification(
  message: string,
  options: NotificationOptions = {}
): Promise<{ success: boolean; errors: string[] }> {
  const config = getConfig();
  const errors: string[] = [];
  const channel = options.channel || 'all';

  // Send to Telegram
  if ((channel === 'telegram' || channel === 'all') && config.features.enableTelegram) {
    try {
      const telegramAdapter = adapterRegistry.get('telegram');
      if (telegramAdapter) {
        // Cast to TelegramAdapter to access specific methods
        const telegram = telegramAdapter as unknown as TelegramAdapter;
        // Get first allowed user or use a default
        const chatId = config.telegram.allowedUsers?.[0];
        if (chatId) {
          const chatIdNum = parseInt(chatId, 10);
          if (!isNaN(chatIdNum)) {
            await telegram.sendMessage(chatIdNum, formatForTelegram(message, options));
          }
        }
      }
    } catch (error) {
      errors.push(`Telegram: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Send to Discord
  if ((channel === 'discord' || channel === 'all') && config.features.enableDiscord) {
    try {
      const discordAdapter = adapterRegistry.get('discord');
      if (discordAdapter) {
        // Cast to DiscordAdapter to access specific methods
        const discord = discordAdapter as unknown as DiscordAdapter;
        const embed = createDiscordEmbed(message, options);
        await discord.sendEmbed(embed, undefined, getDiscordChannel(options.severity));
      }
    } catch (error) {
      errors.push(`Discord: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

// Send workflow completion notification
export async function notifyWorkflowComplete(
  workflowName: string,
  runId: string,
  summary: string,
  duration: string,
  output?: Record<string, unknown>
): Promise<void> {
  const config = getConfig();

  if (config.features.enableDiscord) {
    try {
      const discordAdapter = adapterRegistry.get('discord');
      if (discordAdapter) {
        const discord = discordAdapter as unknown as DiscordAdapter;
        await discord.sendWorkflowComplete(workflowName, runId, summary, duration, output);
      }
    } catch (error) {
      console.error('[Notifications] Failed to send Discord notification:', error);
    }
  }

  if (config.features.enableTelegram) {
    try {
      const telegramAdapter = adapterRegistry.get('telegram');
      if (telegramAdapter) {
        const telegram = telegramAdapter as unknown as TelegramAdapter;
        const chatId = config.telegram.allowedUsers?.[0];
        if (chatId) {
          const chatIdNum = parseInt(chatId, 10);
          if (!isNaN(chatIdNum)) {
            const message = `✅ <b>Workflow Completed</b>\n\n<b>${workflowName}</b>\n${summary}\n\nRun ID: <code>${runId}</code>\nDuration: ${duration}`;
            await telegram.sendMessage(chatIdNum, message, { parseMode: 'HTML' });
          }
        }
      }
    } catch (error) {
      console.error('[Notifications] Failed to send Telegram notification:', error);
    }
  }
}

// Send workflow failure notification
export async function notifyWorkflowFailed(
  workflowName: string,
  runId: string,
  error: string,
  duration: string
): Promise<void> {
  const config = getConfig();

  if (config.features.enableDiscord) {
    try {
      const discordAdapter = adapterRegistry.get('discord');
      if (discordAdapter) {
        const discord = discordAdapter as unknown as DiscordAdapter;
        await discord.sendWorkflowFailed(workflowName, runId, error, duration);
      }
    } catch (err) {
      console.error('[Notifications] Failed to send Discord notification:', err);
    }
  }

  if (config.features.enableTelegram) {
    try {
      const telegramAdapter = adapterRegistry.get('telegram');
      if (telegramAdapter) {
        const telegram = telegramAdapter as unknown as TelegramAdapter;
        const chatId = config.telegram.allowedUsers?.[0];
        if (chatId) {
          const chatIdNum = parseInt(chatId, 10);
          if (!isNaN(chatIdNum)) {
            const message = `❌ <b>Workflow Failed</b>\n\n<b>${workflowName}</b>\n${error}\n\nRun ID: <code>${runId}</code>\nDuration: ${duration}`;
            await telegram.sendMessage(chatIdNum, message, { parseMode: 'HTML' });
          }
        }
      }
    } catch (err) {
      console.error('[Notifications] Failed to send Telegram notification:', err);
    }
  }
}

// Send system alert
export async function sendSystemAlert(
  title: string,
  message: string,
  severity: 'info' | 'warning' | 'error' = 'info'
): Promise<void> {
  const config = getConfig();

  if (config.features.enableDiscord) {
    try {
      const discordAdapter = adapterRegistry.get('discord');
      if (discordAdapter) {
        const discord = discordAdapter as unknown as DiscordAdapter;
        await discord.sendAlert(title, message, severity);
      }
    } catch (err) {
      console.error('[Notifications] Failed to send Discord alert:', err);
    }
  }

  if (config.features.enableTelegram) {
    try {
      const telegramAdapter = adapterRegistry.get('telegram');
      if (telegramAdapter) {
        const telegram = telegramAdapter as unknown as TelegramAdapter;
        const chatId = config.telegram.allowedUsers?.[0];
        if (chatId) {
          const chatIdNum = parseInt(chatId, 10);
          if (!isNaN(chatIdNum)) {
            const emoji = severity === 'error' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️';
            const text = `${emoji} <b>${title}</b>\n\n${message}`;
            await telegram.sendMessage(chatIdNum, text, { parseMode: 'HTML' });
          }
        }
      }
    } catch (err) {
      console.error('[Notifications] Failed to send Telegram alert:', err);
    }
  }
}

// Helper functions
function formatForTelegram(message: string, options: NotificationOptions): string {
  const emoji = getSeverityEmoji(options.severity);
  const title = options.title ? `<b>${options.title}</b>\n\n` : '';
  return `${emoji} ${title}${message}`;
}

function createDiscordEmbed(message: string, options: NotificationOptions): DiscordEmbed {
  const colorMap: Record<NotificationSeverity, number> = {
    info: DiscordColors.INFO,
    success: DiscordColors.SUCCESS,
    warning: DiscordColors.WARNING,
    error: DiscordColors.ERROR,
  };

  return {
    title: options.title,
    description: message,
    color: colorMap[options.severity || 'info'],
    timestamp: new Date().toISOString(),
    footer: {
      text: 'Mission Control',
    },
    fields: options.metadata
      ? Object.entries(options.metadata).map(([name, value]) => ({
          name,
          value: String(value).slice(0, 1024),
          inline: true,
        }))
      : undefined,
  };
}

function getDiscordChannel(severity?: NotificationSeverity): 'status' | 'alerts' | 'logs' {
  switch (severity) {
    case 'error':
    case 'warning':
      return 'alerts';
    case 'success':
      return 'status';
    default:
      return 'logs';
  }
}

function getSeverityEmoji(severity?: NotificationSeverity): string {
  switch (severity) {
    case 'success':
      return '✅';
    case 'warning':
      return '⚠️';
    case 'error':
      return '❌';
    default:
      return 'ℹ️';
  }
}
