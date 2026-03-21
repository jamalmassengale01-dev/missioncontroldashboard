export interface TelegramConfig {
  botToken: string;
  webhookUrl?: string;
  webhookSecret?: string;
  allowedUsers?: string[]; // Array of usernames or user IDs
  pollingMode?: boolean;
  pollingInterval?: number;
}

export interface TelegramMessage {
  messageId: number;
  chatId: number;
  userId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  text: string;
  date: Date;
}

export interface TelegramCommand {
  command: string;
  description: string;
  handler: (message: TelegramMessage, args: string[]) => Promise<void>;
  requireAuth?: boolean;
}

export interface TelegramResponse {
  chatId: number;
  text: string;
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  replyToMessageId?: number;
}
