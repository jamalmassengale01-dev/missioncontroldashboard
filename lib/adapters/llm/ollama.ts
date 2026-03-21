import { BaseLLMProvider, LLMOptions, LLMResponse, LLMChunk } from './base';
import { AdapterHealth } from '../base';

// Ollama provider for local LLMs
export class OllamaProvider extends BaseLLMProvider {
  id = 'ollama';
  name = 'Ollama (Local)';
  version = '1.0.0';

  private baseUrl: string;

  constructor(config: { apiKey: string; baseUrl?: string; model: string; temperature?: number; maxTokens?: number }) {
    super(config);
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
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
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (response.ok) {
        return {
          status: 'healthy',
          latency: Date.now() - start,
          lastChecked: new Date(),
        };
      }
      throw new Error('Ollama API returned error');
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

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options?.model || this.config.model,
        messages,
        stream: false,
        options: {
          temperature: options?.temperature ?? this.config.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? this.config.maxTokens ?? 2048,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      content: data.message?.content || '',
      tokensUsed: data.eval_count || 0,
      model: options?.model || this.config.model,
      finishReason: data.done ? 'stop' : 'unknown',
    };
  }

  async *stream(prompt: string, options?: LLMOptions): AsyncIterable<LLMChunk> {
    const messages: Array<{ role: string; content: string }> = [];
    
    if (options?.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options?.model || this.config.model,
        messages,
        stream: true,
        options: {
          temperature: options?.temperature ?? this.config.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? this.config.maxTokens ?? 2048,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
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
        if (line.trim()) {
          try {
            const chunk = JSON.parse(line);
            yield {
              content: chunk.message?.content || '',
              isComplete: chunk.done || false,
            };
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  }
}
