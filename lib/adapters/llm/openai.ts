import OpenAI from 'openai';
import { BaseLLMProvider, LLMOptions, LLMResponse, LLMChunk } from './base';
import { AdapterHealth } from '../base';

export class OpenAIProvider extends BaseLLMProvider {
  id = 'openai';
  name = 'OpenAI GPT';
  version = '1.0.0';

  private client?: OpenAI;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.client = new OpenAI({
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
      // Quick models list check
      await this.client.models.list();
      return {
        status: 'healthy',
        latency: Date.now() - start,
        lastChecked: new Date(),
      };
    } catch (error) {
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
      throw new Error('OpenAI client not initialized');
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    
    if (options?.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    
    messages.push({ role: 'user', content: prompt });

    const response = await this.client.chat.completions.create({
      model: options?.model || this.config.model,
      messages,
      temperature: options?.temperature ?? this.config.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? this.config.maxTokens,
      stop: options?.stopSequences,
    });

    const choice = response.choices[0];
    if (!choice) {
      throw new Error('No response from OpenAI');
    }

    return {
      content: choice.message.content || '',
      tokensUsed: response.usage?.total_tokens || 0,
      model: response.model,
      finishReason: choice.finish_reason || 'unknown',
    };
  }

  async *stream(prompt: string, options?: LLMOptions): AsyncIterable<LLMChunk> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    
    if (options?.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    
    messages.push({ role: 'user', content: prompt });

    const stream = await this.client.chat.completions.create({
      model: options?.model || this.config.model,
      messages,
      temperature: options?.temperature ?? this.config.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? this.config.maxTokens,
      stop: options?.stopSequences,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      const isComplete = chunk.choices[0]?.finish_reason !== null;
      
      yield {
        content,
        isComplete,
      };
    }
  }
}
