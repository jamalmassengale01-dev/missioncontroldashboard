import { BaseLLMProvider, LLMOptions, LLMResponse, LLMChunk } from './base';
import { AdapterHealth } from '../base';

// LM Studio provider for local LLMs (OpenAI-compatible API)
export class LMStudioProvider extends BaseLLMProvider {
  id = 'lmstudio';
  name = 'LM Studio (Local)';
  version = '1.0.0';

  private baseUrl: string;

  constructor(config: { apiKey: string; baseUrl?: string; model: string; temperature?: number; maxTokens?: number }) {
    super(config);
    this.baseUrl = config.baseUrl || 'http://localhost:1234/v1';
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;
  }

  async dispose(): Promise<void> {
    this.isInitialized = false;
  }

  async health(): Promise<AdapterHealth> {
    const start = Date.now();
    try {
      const response = await fetch(`${this.baseUrl}/models`);
      if (response.ok) {
        return {
          status: 'healthy',
          latency: Date.now() - start,
          lastChecked: new Date(),
        };
      }
      throw new Error('LM Studio API returned error');
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
    const messages: Array<{ role: string; content: string }> = [];
    
    if (options?.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options?.model || this.config.model,
        messages,
        temperature: options?.temperature ?? this.config.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? this.config.maxTokens ?? 2048,
        stop: options?.stopSequences,
      }),
    });

    if (!response.ok) {
      throw new Error(`LM Studio API error: ${response.statusText}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    return {
      content: choice?.message?.content || '',
      tokensUsed: data.usage?.total_tokens || 0,
      model: data.model || this.config.model,
      finishReason: choice?.finish_reason || 'unknown',
    };
  }

  async *stream(prompt: string, options?: LLMOptions): AsyncIterable<LLMChunk> {
    const messages: Array<{ role: string; content: string }> = [];
    
    if (options?.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options?.model || this.config.model,
        messages,
        temperature: options?.temperature ?? this.config.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? this.config.maxTokens ?? 2048,
        stop: options?.stopSequences,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`LM Studio API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            yield { content: '', isComplete: true };
            return;
          }
          try {
            const chunk = JSON.parse(data);
            const content = chunk.choices?.[0]?.delta?.content || '';
            const isComplete = chunk.choices?.[0]?.finish_reason !== null;
            yield { content, isComplete };
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  }
}
