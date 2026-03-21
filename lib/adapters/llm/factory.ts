import { LLMProvider, LLMOptions, LLMResponse, LLMChunk, LLMConfig } from './base';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { KimiProvider } from './kimi';
import { OllamaProvider } from './ollama';
import { LMStudioProvider } from './lmstudio';
import { auditLogger } from '@/lib/audit';

// Token usage tracking
interface TokenUsage {
  provider: string;
  model: string;
  tokensUsed: number;
  timestamp: string;
}

// Provider factory
export class LLMFactory {
  private static providers: Map<string, LLMProvider> = new Map();
  private static fallbackChain: string[] = ['openai', 'anthropic', 'kimi', 'ollama', 'lmstudio'];
  private static tokenUsage: TokenUsage[] = [];
  private static maxTokenHistory = 1000;

  // Register a provider
  static register(provider: LLMProvider): void {
    this.providers.set(provider.id, provider);
  }

  // Get a provider by ID
  static get(id: string): LLMProvider | undefined {
    return this.providers.get(id);
  }

  // Get provider with fallback
  static getProvider(preferredProvider?: string): LLMProvider {
    // Try preferred provider first
    if (preferredProvider) {
      const provider = this.providers.get(preferredProvider);
      if (provider) return provider;
    }

    // Fall back through chain
    for (const id of this.fallbackChain) {
      const provider = this.providers.get(id);
      if (provider) return provider;
    }

    throw new Error('No LLM providers available');
  }

  // Check if provider is available
  static isAvailable(id: string): boolean {
    return this.providers.has(id);
  }

  // Get first available provider from fallback chain
  static getFirstAvailable(): LLMProvider | undefined {
    for (const id of this.fallbackChain) {
      const provider = this.providers.get(id);
      if (provider) return provider;
    }
    return undefined;
  }

  // Set fallback chain priority
  static setFallbackChain(chain: string[]): void {
    this.fallbackChain = chain;
  }

  // Track token usage
  private static trackUsage(provider: string, model: string, tokensUsed: number): void {
    this.tokenUsage.push({
      provider,
      model,
      tokensUsed,
      timestamp: new Date().toISOString(),
    });

    // Trim history if needed
    if (this.tokenUsage.length > this.maxTokenHistory) {
      this.tokenUsage = this.tokenUsage.slice(-this.maxTokenHistory);
    }
  }

  // Get token usage stats
  static getTokenUsage(timeRange?: { start?: string; end?: string }): {
    total: number;
    byProvider: Record<string, number>;
    byModel: Record<string, number>;
    history: TokenUsage[];
  } {
    let usage = [...this.tokenUsage];

    if (timeRange?.start) {
      usage = usage.filter(u => u.timestamp >= timeRange.start!);
    }
    if (timeRange?.end) {
      usage = usage.filter(u => u.timestamp <= timeRange.end!);
    }

    const byProvider: Record<string, number> = {};
    const byModel: Record<string, number> = {};
    let total = 0;

    usage.forEach(u => {
      byProvider[u.provider] = (byProvider[u.provider] || 0) + u.tokensUsed;
      byModel[u.model] = (byModel[u.model] || 0) + u.tokensUsed;
      total += u.tokensUsed;
    });

    return { total, byProvider, byModel, history: usage };
  }

  // Complete with fallback and token tracking
  static async completeWithFallback(
    prompt: string,
    options?: LLMOptions,
    preferredProvider?: string
  ): Promise<LLMResponse> {
    const providersToTry = preferredProvider
      ? [preferredProvider, ...this.fallbackChain.filter((id) => id !== preferredProvider)]
      : this.fallbackChain;

    let lastError: Error | undefined;
    let lastProvider: string | undefined;

    for (const providerId of providersToTry) {
      const provider = this.providers.get(providerId);
      if (!provider) continue;

      try {
        const response = await provider.complete(prompt, options);
        
        // Track token usage
        this.trackUsage(providerId, response.model, response.tokensUsed);

        // Log provider switch if we fell back
        if (lastProvider && lastProvider !== providerId) {
          auditLogger.logLLMProviderSwitch(
            lastProvider,
            providerId,
            `Fallback after error: ${lastError?.message}`
          );
        }

        return response;
      } catch (error) {
        console.warn(`[LLMFactory] Provider ${providerId} failed:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        lastProvider = providerId;
      }
    }

    throw lastError || new Error('No LLM providers available');
  }

  // Stream with fallback (returns first successful stream)
  static async *streamWithFallback(
    prompt: string,
    options?: LLMOptions,
    preferredProvider?: string
  ): AsyncIterable<LLMChunk> {
    const providersToTry = preferredProvider
      ? [preferredProvider, ...this.fallbackChain.filter((id) => id !== preferredProvider)]
      : this.fallbackChain;

    for (const providerId of providersToTry) {
      const provider = this.providers.get(providerId);
      if (!provider || !provider.stream) continue;

      try {
        yield* provider.stream(prompt, options);
        return;
      } catch (error) {
        console.warn(`[LLMFactory] Provider ${providerId} streaming failed:`, error);
      }
    }

    throw new Error('No LLM providers available for streaming');
  }

  // List all registered providers
  static list(): Array<{ id: string; name: string; version: string; initialized: boolean }> {
    return Array.from(this.providers.entries()).map(([id, provider]) => ({
      id,
      name: provider.name,
      version: provider.version,
      initialized: true, // If it's in the map, it's initialized
    }));
  }

  // Get provider health status
  static async getHealthStatus(): Promise<
    Array<{ id: string; name: string; status: 'healthy' | 'degraded' | 'unhealthy'; latency?: number; lastError?: string }>
  > {
    const results = [];
    for (const [id, provider] of this.providers) {
      try {
        const health = await provider.health();
        results.push({
          id,
          name: provider.name,
          status: health.status,
          latency: health.latency,
          lastError: health.lastError,
        });
      } catch {
        results.push({
          id,
          name: provider.name,
          status: 'unhealthy' as const,
          lastError: 'Health check failed',
        });
      }
    }
    return results;
  }

  // Initialize all providers
  static async initializeAll(): Promise<Array<{ id: string; success: boolean; error?: string }>> {
    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    for (const [id, provider] of this.providers) {
      try {
        await provider.initialize();
        results.push({ id, success: true });
      } catch (error) {
        results.push({
          id,
          success: false,
          error: error instanceof Error ? error.message : 'Initialization failed',
        });
      }
    }

    return results;
  }

  // Create and register providers from config
  static createFromConfig(configs: Record<string, LLMConfig & { baseUrl?: string }>): void {
    // OpenAI
    if (configs.openai?.apiKey) {
      this.register(new OpenAIProvider(configs.openai));
    }

    // Anthropic
    if (configs.anthropic?.apiKey) {
      this.register(new AnthropicProvider(configs.anthropic));
    }

    // Kimi
    if (configs.kimi?.apiKey) {
      this.register(new KimiProvider(configs.kimi));
    }

    // Ollama (local)
    if (configs.ollama) {
      this.register(new OllamaProvider({
        apiKey: 'local',
        baseUrl: configs.ollama.baseUrl,
        model: configs.ollama.model,
        temperature: configs.ollama.temperature,
        maxTokens: configs.ollama.maxTokens,
      }));
    }

    // LM Studio (local)
    if (configs.lmstudio) {
      this.register(new LMStudioProvider({
        apiKey: 'local',
        baseUrl: configs.lmstudio.baseUrl,
        model: configs.lmstudio.model,
        temperature: configs.lmstudio.temperature,
        maxTokens: configs.lmstudio.maxTokens,
      }));
    }
  }
}

// Export singleton for convenience
export const llmFactory = LLMFactory;
