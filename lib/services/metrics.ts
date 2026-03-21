// Simple in-memory metrics service

interface MetricValue {
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
}

interface MetricSeries {
  name: string;
  values: MetricValue[];
  maxSize: number;
}

class MetricsService {
  private metrics: Map<string, MetricSeries> = new Map();
  private readonly DEFAULT_MAX_SIZE = 10000;

  // Record a metric value
  record(
    name: string,
    value: number,
    labels?: Record<string, string>,
    maxSize?: number
  ): void {
    let series = this.metrics.get(name);

    if (!series) {
      series = {
        name,
        values: [],
        maxSize: maxSize || this.DEFAULT_MAX_SIZE,
      };
      this.metrics.set(name, series);
    }

    series.values.push({
      value,
      timestamp: new Date(),
      labels,
    });

    // Prune old values if exceeding max size
    if (series.values.length > series.maxSize) {
      series.values = series.values.slice(-series.maxSize);
    }
  }

  // Get all values for a metric
  getValues(name: string): MetricValue[] {
    const series = this.metrics.get(name);
    return series ? [...series.values] : [];
  }

  // Get latest value for a metric
  getLatest(name: string): MetricValue | null {
    const series = this.metrics.get(name);
    return series && series.values.length > 0
      ? series.values[series.values.length - 1]
      : null;
  }

  // Get average over time window
  getAverage(name: string, windowMs: number = 60000): number | null {
    const series = this.metrics.get(name);
    if (!series || series.values.length === 0) return null;

    const cutoff = new Date(Date.now() - windowMs);
    const values = series.values.filter(v => v.timestamp >= cutoff);

    if (values.length === 0) return null;

    const sum = values.reduce((acc, v) => acc + v.value, 0);
    return sum / values.length;
  }

  // Get sum over time window
  getSum(name: string, windowMs: number = 60000): number | null {
    const series = this.metrics.get(name);
    if (!series || series.values.length === 0) return null;

    const cutoff = new Date(Date.now() - windowMs);
    const values = series.values.filter(v => v.timestamp >= cutoff);

    if (values.length === 0) return null;

    return values.reduce((acc, v) => acc + v.value, 0);
  }

  // Get count over time window
  getCount(name: string, windowMs: number = 60000): number {
    const series = this.metrics.get(name);
    if (!series || series.values.length === 0) return 0;

    const cutoff = new Date(Date.now() - windowMs);
    return series.values.filter(v => v.timestamp >= cutoff).length;
  }

  // List all metric names
  listMetrics(): string[] {
    return Array.from(this.metrics.keys());
  }

  // Clear all metrics
  clear(): void {
    this.metrics.clear();
  }

  // Clear specific metric
  clearMetric(name: string): void {
    this.metrics.delete(name);
  }

  // Get metrics summary
  getSummary(): Record<string, { count: number; latest: number | null; average: number | null }> {
    const summary: Record<string, { count: number; latest: number | null; average: number | null }> = {};

    for (const [name, series] of this.metrics) {
      summary[name] = {
        count: series.values.length,
        latest: this.getLatest(name)?.value ?? null,
        average: this.getAverage(name),
      };
    }

    return summary;
  }
}

// Export singleton
export const metrics = new MetricsService();

// Convenience functions for common metrics
export function recordWorkflowExecution(
  workflowId: string,
  durationMs: number,
  success: boolean
): void {
  metrics.record('workflow_executions_total', 1, { workflowId, status: success ? 'success' : 'failure' });
  metrics.record('workflow_execution_duration_ms', durationMs, { workflowId });
}

export function recordAgentUtilization(
  agentId: string,
  activeRuns: number
): void {
  metrics.record('agent_active_runs', activeRuns, { agentId });
}

export function recordQueueDepth(queueName: string, depth: number): void {
  metrics.record('queue_depth', depth, { queue: queueName });
}

export function recordApiRequest(
  endpoint: string,
  method: string,
  durationMs: number,
  statusCode: number
): void {
  metrics.record('api_requests_total', 1, {
    endpoint,
    method,
    status: statusCode >= 200 && statusCode < 300 ? 'success' : 'error',
  });
  metrics.record('api_request_duration_ms', durationMs, { endpoint, method });
}

export function recordError(errorType: string, source: string): void {
  metrics.record('errors_total', 1, { type: errorType, source });
}

// Legacy metricsService object for backward compatibility
export const metricsService = {
  record: (name: string, value: number, labels?: Record<string, string>) => metrics.record(name, value, labels),
  getLatest: (name: string) => metrics.getLatest(name),
  getAverage: (name: string, windowMs?: number) => metrics.getAverage(name, windowMs),
  getCount: (name: string, windowMs?: number) => metrics.getCount(name, windowMs),
  recordWorkflowExecution,
  recordAgentStatus: (agentId: string, status: string) => {
    metrics.record('agent_status_changes', 1, { agentId, status });
  },
  recordWorkflowDuration: (durationMs: number, agentId: string) => {
    metrics.record('workflow_execution_duration_ms', durationMs, { agentId });
  },
};
