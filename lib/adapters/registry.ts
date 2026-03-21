import { Adapter, AdapterHealth } from './base';

interface RegisteredAdapter {
  adapter: Adapter<any>;
  enabled: boolean;
  registeredAt: Date;
}

class AdapterRegistry {
  private adapters: Map<string, RegisteredAdapter> = new Map();
  private healthCache: Map<string, { health: AdapterHealth; expiresAt: Date }> = new Map();
  private readonly HEALTH_CACHE_TTL_MS = 30000; // 30 seconds

  // Register an adapter
  register(adapter: Adapter<any>, enabled = true): void {
    if (this.adapters.has(adapter.id)) {
      throw new Error(`Adapter with ID "${adapter.id}" is already registered`);
    }

    this.adapters.set(adapter.id, {
      adapter,
      enabled,
      registeredAt: new Date(),
    });
  }

  // Unregister an adapter
  unregister(adapterId: string): boolean {
    const registered = this.adapters.get(adapterId);
    if (!registered) return false;

    // Dispose if available
    if (registered.adapter.dispose) {
      registered.adapter.dispose().catch(console.error);
    }

    this.adapters.delete(adapterId);
    this.healthCache.delete(adapterId);
    return true;
  }

  // Get an adapter by ID
  get<T>(adapterId: string): Adapter<T> | undefined {
    const registered = this.adapters.get(adapterId);
    if (!registered || !registered.enabled) return undefined;
    return registered.adapter as Adapter<T>;
  }

  // Check if adapter exists and is enabled
  isEnabled(adapterId: string): boolean {
    const registered = this.adapters.get(adapterId);
    return registered?.enabled ?? false;
  }

  // Enable/disable an adapter
  setEnabled(adapterId: string, enabled: boolean): boolean {
    const registered = this.adapters.get(adapterId);
    if (!registered) return false;

    registered.enabled = enabled;
    return true;
  }

  // List all adapters
  list(): Array<{ id: string; name: string; version: string; enabled: boolean }> {
    return Array.from(this.adapters.entries()).map(([id, registered]) => ({
      id,
      name: registered.adapter.name,
      version: registered.adapter.version,
      enabled: registered.enabled,
    }));
  }

  // Get health status for all adapters
  async getAllHealth(): Promise<
    Array<{
      id: string;
      name: string;
      enabled: boolean;
      health: AdapterHealth;
    }>
  > {
    const results = await Promise.all(
      Array.from(this.adapters.entries()).map(async ([id, registered]) => {
        const health = await this.getHealth(id);
        return {
          id,
          name: registered.adapter.name,
          enabled: registered.enabled,
          health,
        };
      })
    );
    return results;
  }

  // Get health for a specific adapter (with caching)
  async getHealth(adapterId: string): Promise<AdapterHealth> {
    const registered = this.adapters.get(adapterId);
    if (!registered) {
      return {
        status: 'unhealthy',
        lastError: 'Adapter not found',
        lastChecked: new Date(),
      };
    }

    if (!registered.enabled) {
      return {
        status: 'degraded',
        lastError: 'Adapter is disabled',
        lastChecked: new Date(),
      };
    }

    // Check cache
    const cached = this.healthCache.get(adapterId);
    if (cached && cached.expiresAt > new Date()) {
      return cached.health;
    }

    // Perform health check
    try {
      const health = await registered.adapter.health();
      this.healthCache.set(adapterId, {
        health,
        expiresAt: new Date(Date.now() + this.HEALTH_CACHE_TTL_MS),
      });
      return health;
    } catch (error) {
      const health: AdapterHealth = {
        status: 'unhealthy',
        lastError: error instanceof Error ? error.message : 'Health check failed',
        lastChecked: new Date(),
      };
      this.healthCache.set(adapterId, {
        health,
        expiresAt: new Date(Date.now() + this.HEALTH_CACHE_TTL_MS),
      });
      return health;
    }
  }

  // Initialize all enabled adapters
  async initializeAll(): Promise<
    Array<{ id: string; success: boolean; error?: string }>
  > {
    const results = await Promise.all(
      Array.from(this.adapters.entries()).map(async ([id, registered]) => {
        if (!registered.enabled) {
          return { id, success: true };
        }
        try {
          await registered.adapter.initialize();
          return { id, success: true };
        } catch (error) {
          return {
            id,
            success: false,
            error: error instanceof Error ? error.message : 'Initialization failed',
          };
        }
      })
    );
    return results;
  }

  // Dispose all adapters
  async disposeAll(): Promise<void> {
    await Promise.all(
      Array.from(this.adapters.values()).map(async (registered) => {
        if (registered.adapter.dispose) {
          try {
            await registered.adapter.dispose();
          } catch (error) {
            console.error(`Error disposing adapter ${registered.adapter.id}:`, error);
          }
        }
      })
    );
    this.adapters.clear();
    this.healthCache.clear();
  }
}

// Export singleton instance
export const adapterRegistry = new AdapterRegistry();
