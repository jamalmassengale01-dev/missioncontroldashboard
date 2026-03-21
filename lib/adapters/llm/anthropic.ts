import Anthropic from '@anthropic-ai/sdk';
import { BaseLLMProvider, LLMOptions, LLMResponse, LLMChunk } from './base';
import { AdapterHealth } from '../base';

export class AnthropicProvider extends BaseLLMProvider {
  id = 'anthropic';
  name = 'Anthropic Claude';
  version = '1.0.0';

  private client?: Anthropic;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.client = new Anthropic({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseUrl,
      timeout: this.config.timeoutMs || 60000,
    });

    this.isInitialized = true;
  }

  async dispose(): Promise<void> {
    this.client = undefined;
    this.isInitialized = false;
  }

  async health(): Promise<AdapterHealth> {
    if (!this.client) {
      return {
        status: 'unhealthy',
        lastError: 'Client not initialized',
        lastChecked: new Date(),
      };
    }

    const start = Date.now();
    try {
      // Simple API check - list models or make a minimal request
      await this.client.messages.create({
        model: this.config.model,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }],
      });
      return {
        status: 'healthy',
        latency: Date.now() - start,
        lastChecked: new Date(),
      };
    } catch (error) {
      // Anthropic might return an error for invalid request, but API is reachable
      if (error instanceof Anthropic.APIError && error.status !== 401 && error.status !== 403) {
        return {
          status: 'healthy',
          latency: Date.now() - start,
          lastChecked: new Date(),
        };
      }
      return {
        status: 'unhealthy',
        latency: Date.now() - start,
        lastError: error instanceof Error ? error.message : 'Health check failed',
        lastChecked: new Date(),
      };
    }
  }

  async complete(prompt: string, options?: LLMOptions): Promise<LLMResponse> {
    if (!this.client) {
      throw new Error('Anthropic client not initialized');
    }

    const response = await this.client.messages.create({
      model: options?.model || this.config.model,
      max_tokens: options?.maxTokens ?? this.config.maxTokens ?? 4096,
      temperature: options?.temperature ?? this.config.temperature ?? 0.7,
      system: options?.systemPrompt,
      stop_sequences: options?.stopSequences,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    return {
      content,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      model: response.model,
      finishReason: response.stop_reason || 'unknown',
    };
  }

  async *stream(prompt: string, options?: LLMOptions): AsyncIterable<LLMChunk> {
    if (!this.client) {
      throw new Error('Anthropic client not initialized');
    }

    const stream = await this.client.messages.create({
      model: options?.model || this.config.model,
      max_tokens: options?.maxTokens ?? this.config.maxTokens ?? 4096,
      temperature: options?.temperature ?? this.config.temperature ?? 0.7,
      system: options?.systemPrompt,
      stop_sequences: options?.stopSequences,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield {
          content: event.delta.text,
          isComplete: false,
        };
      }
      if (event.type === 'message_stop') {
        yield {
          content: '',
          isComplete: true,
        };
      }
    }
  }
}
