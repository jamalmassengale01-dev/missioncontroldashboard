import { Adapter } from '../base';

export interface LLMConfig {
  apiKey: string;
  baseUrl?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  systemPrompt?: string;
  model?: string;
}

export interface LLMResponse {
  content: string;
  tokensUsed: number;
  model: string;
  finishReason: string;
}

export interface LLMChunk {
  content: string;
  isComplete: boolean;
}

export interface LLMProvider extends Adapter<LLMConfig> {
  complete(prompt: string, options?: LLMOptions): Promise<LLMResponse>;
  stream?(prompt: string, options?: LLMOptions): AsyncIterable<LLMChunk>;
}

// Base class for LLM providers
export abstract class BaseLLMProvider implements LLMProvider {
  abstract id: string;
  abstract name: string;
  abstract version: string;
  config: LLMConfig;
  protected isInitialized = false;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  abstract initialize(): Promise<void>;
  abstract health(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency?: number;
    lastError?: string;
    lastChecked: Date;
  }>;
  abstract complete(prompt: string, options?: LLMOptions): Promise<LLMResponse>;

  dispose?(): Promise<void>;
}
