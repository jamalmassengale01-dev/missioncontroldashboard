import { BaseAdapter, AdapterHealth } from '../base';
import { DiscordConfig, DiscordMessage, DiscordEmbed, DiscordColors } from './config';

interface QueuedMessage {
  id: string;
  message: DiscordMessage;
  channel: 'status' | 'alerts' | 'logs';
  attempts: number;
  lastAttempt?: Date;
}

export class DiscordAdapter extends BaseAdapter<DiscordConfig> {
  id = 'discord';
  name = 'Discord Webhook Adapter';
  version = '1.0.0';

  private messageQueue: QueuedMessage[] = [];
  private processingQueue = false;
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Validate webhook URL
    if (!this.isValidWebhookUrl(this.config.webhookUrl)) {
      throw new Error('Invalid Discord webhook URL');
    }

    this.isInitialized = true;
    console.log('[DiscordAdapter] Initialized');
  }

  async dispose(): Promise<void> {
    // Clear all retry timeouts
    this.retryTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.retryTimeouts.clear();
    this.isInitialized = false;
  }

  async health(): Promise<AdapterHealth> {
    const check = await this.checkHealth(async () => {
      // Discord webhooks don't have a health endpoint, so we do a minimal check
      const response = await fetch(this.config.webhookUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      // Discord returns 401 for GET requests to webhooks (which is expected)
      if (response.status !== 401) {
        throw new Error(`Unexpected response: ${response.status}`);
      }
    });

    return {
      status: check.success ? 'healthy' : 'unhealthy',
      latency: check.latency,
      lastError: check.error,
      lastChecked: new Date(),
    };
  }

  // Send a simple text message
  async sendMessage(
    content: string,
    channel: 'status' | 'alerts' | 'logs' = 'status'
  ): Promise<void> {
    const channelWebhook = this.config.channels[channel];
    const webhookUrl = channelWebhook || this.config.webhookUrl;

    await this.postToWebhook({
      content,
      username: this.config.username,
      avatar_url: this.config.avatarUrl,
    }, webhookUrl);
  }

  // Send a message with embeds
  async sendEmbed(
    embed: DiscordEmbed,
    content?: string,
    channel: 'status' | 'alerts' | 'logs' = 'status'
  ): Promise<void> {
    const channelWebhook = this.config.channels[channel];
    const webhookUrl = channelWebhook || this.config.webhookUrl;

    await this.postToWebhook({
      content,
      username: this.config.username,
      avatar_url: this.config.avatarUrl,
      embeds: [embed],
    }, webhookUrl);
  }

  // Send workflow completion notification
  async sendWorkflowComplete(
    workflowName: string,
    runId: string,
    summary: string,
    duration: string,
    output?: Record<string, unknown>
  ): Promise<void> {
    const embed: DiscordEmbed = {
      title: '✅ Workflow Completed',
      description: summary,
      color: DiscordColors.SUCCESS,
      timestamp: new Date().toISOString(),
      fields: [
        {
          name: 'Workflow',
          value: workflowName,
          inline: true,
        },
        {
          name: 'Run ID',
          value: runId,
          inline: true,
        },
        {
          name: 'Duration',
          value: duration,
          inline: true,
        },
      ],
      footer: {
        text: 'Mission Control',
      },
    };

    if (output && Object.keys(output).length > 0) {
      embed.fields!.push({
        name: 'Output',
        value: '```json\n' + JSON.stringify(output, null, 2).slice(0, 1000) + '\n```',
        inline: false,
      });
    }

    await this.sendEmbed(embed, undefined, 'status');
  }

  // Send workflow failure notification
  async sendWorkflowFailed(
    workflowName: string,
    runId: string,
    error: string,
    duration: string
  ): Promise<void> {
    const embed: DiscordEmbed = {
      title: '❌ Workflow Failed',
      description: error,
      color: DiscordColors.ERROR,
      timestamp: new Date().toISOString(),
      fields: [
        {
          name: 'Workflow',
          value: workflowName,
          inline: true,
        },
        {
          name: 'Run ID',
          value: runId,
          inline: true,
        },
        {
          name: 'Duration',
          value: duration,
          inline: true,
        },
      ],
      footer: {
        text: 'Mission Control',
      },
    };

    await this.sendEmbed(embed, undefined, 'alerts');
  }

  // Send system alert
  async sendAlert(
    title: string,
    message: string,
    severity: 'info' | 'warning' | 'error' = 'info'
  ): Promise<void> {
    const colorMap = {
      info: DiscordColors.INFO,
      warning: DiscordColors.WARNING,
      error: DiscordColors.ERROR,
    };

    const emojiMap = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '🚨',
    };

    const embed: DiscordEmbed = {
      title: `${emojiMap[severity]} ${title}`,
      description: message,
      color: colorMap[severity],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Mission Control Alert',
      },
    };

    await this.sendEmbed(embed, undefined, 'alerts');
  }

  // Post to webhook with retry logic
  private async postToWebhook(
    message: DiscordMessage,
    webhookUrl: string,
    attempt = 1
  ): Promise<void> {
    const maxRetries = this.config.retryAttempts || 3;
    const timeout = this.config.timeoutMs || 10000;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Discord API error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
        console.log(`[DiscordAdapter] Retry ${attempt}/${maxRetries} after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.postToWebhook(message, webhookUrl, attempt + 1);
      }
      throw error;
    }
  }

  // Queue a message for later delivery
  queueMessage(
    message: DiscordMessage,
    channel: 'status' | 'alerts' | 'logs' = 'status'
  ): string {
    const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.messageQueue.push({ id, message, channel, attempts: 0 });
    this.processQueue();
    return id;
  }

  // Process queued messages
  private async processQueue(): Promise<void> {
    if (this.processingQueue || this.messageQueue.length === 0) return;

    this.processingQueue = true;

    while (this.messageQueue.length > 0) {
      const queued = this.messageQueue[0];
      const channelWebhook = this.config.channels[queued.channel];
      const webhookUrl = channelWebhook || this.config.webhookUrl;

      try {
        queued.attempts++;
        queued.lastAttempt = new Date();
        await this.postToWebhook(queued.message, webhookUrl);
        this.messageQueue.shift(); // Remove from queue on success
      } catch (error) {
        console.error('[DiscordAdapter] Failed to send queued message:', error);
        if (queued.attempts >= (this.config.retryAttempts || 3)) {
          // Give up on this message
          this.messageQueue.shift();
        } else {
          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    }

    this.processingQueue = false;
  }

  // Validate webhook URL format
  private isValidWebhookUrl(url: string): boolean {
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
}
