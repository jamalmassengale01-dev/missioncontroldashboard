import TelegramBot from 'node-telegram-bot-api';
import { BaseAdapter, AdapterHealth } from '../base';
import {
  TelegramConfig,
  TelegramMessage,
  TelegramCommand,
} from './config';

export class TelegramAdapter extends BaseAdapter<TelegramConfig> {
  id = 'telegram';
  name = 'Telegram Bot Adapter';
  version = '1.0.0';

  private bot?: TelegramBot;
  private commands: Map<string, TelegramCommand> = new Map();
  private isPolling = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.bot = new TelegramBot(this.config.botToken, {
      polling: false, // We'll handle polling manually
    });

    // Set up message handler
    this.bot.on('message', this.handleMessage.bind(this));

    // Start polling or set webhook
    if (this.config.pollingMode || !this.config.webhookUrl) {
      await this.startPolling();
    } else {
      await this.setupWebhook();
    }

    this.isInitialized = true;
  }

  private async startPolling(): Promise<void> {
    if (!this.bot) return;

    await this.bot.startPolling();
    this.isPolling = true;
    console.log('[TelegramAdapter] Started polling mode');
  }

  private async setupWebhook(): Promise<void> {
    if (!this.bot || !this.config.webhookUrl) return;

    await this.bot.setWebHook(this.config.webhookUrl, {
      secret_token: this.config.webhookSecret,
    });
    console.log(`[TelegramAdapter] Webhook set to ${this.config.webhookUrl}`);
  }

  async dispose(): Promise<void> {
    if (this.bot) {
      if (this.isPolling) {
        await this.bot.stopPolling();
      } else if (this.config.webhookUrl) {
        await this.bot.deleteWebHook();
      }
      this.bot = undefined;
    }
    this.isInitialized = false;
  }

  async health(): Promise<AdapterHealth> {
    if (!this.bot) {
      return {
        status: 'unhealthy',
        lastError: 'Bot not initialized',
        lastChecked: new Date(),
      };
    }

    const check = await this.checkHealth(async () => {
      await this.bot!.getMe();
    });

    return {
      status: check.success ? 'healthy' : 'unhealthy',
      latency: check.latency,
      lastError: check.error,
      lastChecked: new Date(),
    };
  }

  // Register a command
  registerCommand(command: TelegramCommand): void {
    this.commands.set(command.command.toLowerCase(), command);
  }

  // Unregister a command
  unregisterCommand(commandName: string): boolean {
    return this.commands.delete(commandName.toLowerCase());
  }

  // List all registered commands
  listCommands(): Array<{ command: string; description: string }> {
    return Array.from(this.commands.values()).map((cmd) => ({
      command: cmd.command,
      description: cmd.description,
    }));
  }

  // Send a message
  async sendMessage(
    chatId: number,
    text: string,
    options?: {
      parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
      replyToMessageId?: number;
    }
  ): Promise<TelegramBot.Message> {
    if (!this.bot) {
      throw new Error('Telegram bot not initialized');
    }

    return await this.bot.sendMessage(chatId, text, {
      parse_mode: options?.parseMode,
      reply_to_message_id: options?.replyToMessageId,
    });
  }

  // Handle incoming message
  private async handleMessage(msg: TelegramBot.Message): Promise<void> {
    if (!msg.text) return;

    const telegramMessage: TelegramMessage = {
      messageId: msg.message_id,
      chatId: msg.chat.id,
      userId: msg.from?.id || 0,
      username: msg.from?.username,
      firstName: msg.from?.first_name,
      lastName: msg.from?.last_name,
      text: msg.text,
      date: new Date(msg.date * 1000),
    };

    // Check if user is authorized
    if (!this.isAuthorized(telegramMessage)) {
      await this.sendMessage(
        telegramMessage.chatId,
        '⛔ You are not authorized to use this bot.'
      );
      return;
    }

    // Parse command
    const { command, args } = this.parseCommand(telegramMessage.text);

    if (command) {
      const cmd = this.commands.get(command.toLowerCase());
      if (cmd) {
        try {
          await cmd.handler(telegramMessage, args);
        } catch (error) {
          console.error(`[TelegramAdapter] Command error:`, error);
          await this.sendMessage(
            telegramMessage.chatId,
            `❌ Error executing command: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        }
      } else {
        await this.sendMessage(
          telegramMessage.chatId,
          `❓ Unknown command: /${command}\nUse /help to see available commands.`
        );
      }
    } else {
      // Handle non-command messages
      await this.sendMessage(
        telegramMessage.chatId,
        '👋 Hello! I am Mission Control Bot. Use /help to see available commands.'
      );
    }
  }

  // Parse command from message text
  private parseCommand(text: string): { command?: string; args: string[] } {
    if (!text.startsWith('/')) {
      return { args: [] };
    }

    const parts = text.slice(1).split(' ');
    const command = parts[0].split('@')[0]; // Remove bot username if present
    const args = parts.slice(1);

    return { command, args };
  }

  // Check if user is authorized
  private isAuthorized(message: TelegramMessage): boolean {
    if (!this.config.allowedUsers || this.config.allowedUsers.length === 0) {
      return true; // No restrictions
    }

    const userIdentifier = message.username || message.userId.toString();
    return this.config.allowedUsers.includes(userIdentifier);
  }

  // Process webhook update
  async processWebhookUpdate(update: TelegramBot.Update): Promise<void> {
    if (!this.bot) {
      throw new Error('Telegram bot not initialized');
    }

    // Process the update through the bot's internal handler
    (this.bot as any).processUpdate(update);
  }

  // Get bot info
  async getBotInfo(): Promise<TelegramBot.User | null> {
    if (!this.bot) return null;
    try {
      return await this.bot.getMe();
    } catch {
      return null;
    }
  }
}
