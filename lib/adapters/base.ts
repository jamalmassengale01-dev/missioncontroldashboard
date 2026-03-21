export interface Adapter<TConfig> {
  id: string;
  name: string;
  version: string;
  config: TConfig;
  initialize(): Promise<void>;
  health(): Promise<AdapterHealth>;
  dispose?(): Promise<void>;
}

export interface AdapterHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  lastError?: string;
  lastChecked: Date;
}

export abstract class BaseAdapter<TConfig> implements Adapter<TConfig> {
  abstract id: string;
  abstract name: string;
  abstract version: string;
  config: TConfig;
  protected isInitialized = false;
  protected lastHealthCheck?: AdapterHealth;

  constructor(config: TConfig) {
    this.config = config;
  }

  abstract initialize(): Promise<void>;
  abstract health(): Promise<AdapterHealth>;

  protected async checkHealth<T>(
    checkFn: () => Promise<T>,
    timeoutMs = 5000
  ): Promise<{ success: boolean; latency: number; error?: string }> {
    const start = Date.now();
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Health check timeout')), timeoutMs)
      );
      await Promise.race([checkFn(), timeoutPromise]);
      return { success: true, latency: Date.now() - start };
    } catch (error) {
      return {
        success: false,
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
