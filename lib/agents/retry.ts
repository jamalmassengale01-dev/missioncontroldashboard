// Retry configuration
export interface RetryConfig {
  maxRetries: number;
  backoffMultiplier: number;
  initialDelay: number;
  maxDelay: number;
}

// Default retry configuration
export const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  backoffMultiplier: 2,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
};

// Circuit breaker states
type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
}

interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  lastFailureTime: number | null;
  nextAttemptTime: number | null;
}

// Circuit breaker for external service calls
export class CircuitBreaker {
  private state: CircuitBreakerState;
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: 5,
      resetTimeoutMs: 30000,
      ...config,
    };
    this.state = {
      state: 'closed',
      failures: 0,
      lastFailureTime: null,
      nextAttemptTime: null,
    };
  }

  // Check if request can proceed
  canExecute(): boolean {
    if (this.state.state === 'closed') {
      return true;
    }

    if (this.state.state === 'open') {
      if (Date.now() >= (this.state.nextAttemptTime || 0)) {
        this.state.state = 'half-open';
        return true;
      }
      return false;
    }

    // half-open
    return true;
  }

  // Record success
  recordSuccess(): void {
    this.state.failures = 0;
    this.state.state = 'closed';
    this.state.lastFailureTime = null;
    this.state.nextAttemptTime = null;
  }

  // Record failure
  recordFailure(): void {
    this.state.failures++;
    this.state.lastFailureTime = Date.now();

    if (this.state.failures >= this.config.failureThreshold) {
      this.state.state = 'open';
      this.state.nextAttemptTime = Date.now() + this.config.resetTimeoutMs;
    }
  }

  // Get current state
  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  // Check if circuit is open
  isOpen(): boolean {
    return this.state.state === 'open' && Date.now() < (this.state.nextAttemptTime || 0);
  }
}

// Dead letter queue entry
export interface DeadLetterEntry {
  id: string;
  runId: string;
  agentId: string;
  error: string;
  failedAt: string;
  retryCount: number;
  lastError: string;
  input: Record<string, any>;
}

// Dead letter queue for failed jobs
class DeadLetterQueue {
  private entries: Map<string, DeadLetterEntry> = new Map();

  // Add a failed job to the DLQ
  add(entry: Omit<DeadLetterEntry, 'id' | 'failedAt'>): DeadLetterEntry {
    const fullEntry: DeadLetterEntry = {
      ...entry,
      id: `dlq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      failedAt: new Date().toISOString(),
    };

    this.entries.set(fullEntry.id, fullEntry);
    return fullEntry;
  }

  // Get an entry by ID
  get(id: string): DeadLetterEntry | undefined {
    return this.entries.get(id);
  }

  // Get all entries
  getAll(): DeadLetterEntry[] {
    return Array.from(this.entries.values()).sort(
      (a, b) => new Date(b.failedAt).getTime() - new Date(a.failedAt).getTime()
    );
  }

  // Get entries for a specific run
  getByRunId(runId: string): DeadLetterEntry[] {
    return this.getAll().filter(e => e.runId === runId);
  }

  // Remove an entry (when successfully retried)
  remove(id: string): boolean {
    return this.entries.delete(id);
  }

  // Get count
  getCount(): number {
    return this.entries.size;
  }

  // Clear all entries
  clear(): void {
    this.entries.clear();
  }
}

// Export singleton instance
export const deadLetterQueue = new DeadLetterQueue();

// Calculate delay for retry attempt
export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig = defaultRetryConfig
): number {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxDelay);
}

// Sleep helper
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry wrapper for async functions
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryConfig> & { onRetry?: (attempt: number, error: Error) => void } = {}
): Promise<T> {
  const config = { ...defaultRetryConfig, ...options };
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === config.maxRetries) {
        break;
      }

      if (options.onRetry) {
        options.onRetry(attempt, lastError);
      }

      const delay = calculateRetryDelay(attempt, config);
      await sleep(delay);
    }
  }

  throw lastError || new Error('Retry failed');
}
