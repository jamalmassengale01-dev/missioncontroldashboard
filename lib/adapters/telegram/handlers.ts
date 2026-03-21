import TelegramBot from 'node-telegram-bot-api';
import { TelegramAdapter } from './adapter';
import { registerTelegramCommands } from './commands';

// Message handler for webhook processing
export async function handleTelegramWebhook(
  adapter: TelegramAdapter,
  update: TelegramBot.Update
): Promise<void> {
  await adapter.processWebhookUpdate(update);
}

// Initialize Telegram bot with all commands
export function initializeTelegramBot(adapter: TelegramAdapter): void {
  registerTelegramCommands(adapter);
}

// Create and configure Telegram adapter
export function createTelegramAdapter(config: {
  botToken: string;
  webhookUrl?: string;
  webhookSecret?: string;
  allowedUsers?: string[];
  pollingMode?: boolean;
  pollingInterval?: number;
}): TelegramAdapter {
  const adapter = new TelegramAdapter(config);
  initializeTelegramBot(adapter);
  return adapter;
}

// Export types
export type { TelegramMessage, TelegramCommand, TelegramConfig } from './config';
export { TelegramAdapter } from './adapter';
