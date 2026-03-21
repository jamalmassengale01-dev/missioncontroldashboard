import { WorkflowRun, WorkflowLog, WorkflowDefinition, WorkflowOutput } from '@/lib/types';
import { SupabaseAdapter } from '@/lib/adapters/supabase/adapter';

// Database-backed workflow store
// Mirrors the interface of the in-memory workflowStore
export class DatabaseStore {
  private adapter: SupabaseAdapter;

  constructor(adapter: SupabaseAdapter) {
    this.adapter = adapter;
  }

  // Create a new workflow run
  async createRun(
    definition: WorkflowDefinition,
    input: Record<string, any>,
    assignedAgent: string
  ): Promise<WorkflowRun> {
    const id = `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const run: WorkflowRun = {
      id,
      workflowId: definition.id,
      workflowName: definition.name,
      assignedAgent,
      input,
      status: 'queued',
      startedAt: now,
      logs: [
        {
          id: `log-${Date.now()}`,
          timestamp: now,
          level: 'info',
          message: `Workflow "${definition.name}" created and queued`,
        },
      ],
      retryCount: 0,
    };

    await this.adapter.createWorkflowRun(run);
    await this.adapter.addWorkflowLog(run.id, run.logs[0]);

    return run;
  }

  // Get a workflow run by ID
  async getRun(id: string): Promise<WorkflowRun | undefined> {
    const run = await this.adapter.getWorkflowRun(id);
    if (!run) return undefined;

    // Load logs
    run.logs = await this.adapter.getWorkflowLogs(id);
    return run;
  }

  // Update a workflow run
  async updateRun(id: string, updates: Partial<WorkflowRun>): Promise<WorkflowRun | undefined> {
    await this.adapter.updateWorkflowRun(id, updates);
    return this.getRun(id);
  }

  // Add a log entry to a workflow run
  async addLog(runId: string, log: WorkflowLog): Promise<boolean> {
    try {
      await this.adapter.addWorkflowLog(runId, log);
      return true;
    } catch {
      return false;
    }
  }

  // Complete a workflow run
  async completeRun(id: string, output: WorkflowOutput): Promise<WorkflowRun | undefined> {
    const run = await this.getRun(id);
    if (!run) return undefined;

    const now = new Date().toISOString();
    const updatedRun: Partial<WorkflowRun> = {
      status: 'completed',
      endedAt: now,
      output,
    };

    await this.adapter.updateWorkflowRun(id, updatedRun);

    const log: WorkflowLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      level: 'info',
      message: `Workflow completed successfully: ${output.summary}`,
    };
    await this.adapter.addWorkflowLog(id, log);

    return this.getRun(id);
  }

  // Fail a workflow run
  async failRun(id: string, error: string): Promise<WorkflowRun | undefined> {
    const run = await this.getRun(id);
    if (!run) return undefined;

    const now = new Date().toISOString();
    const updatedRun: Partial<WorkflowRun> = {
      status: 'failed',
      endedAt: now,
      error,
    };

    await this.adapter.updateWorkflowRun(id, updatedRun);

    const log: WorkflowLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      level: 'error',
      message: `Workflow failed: ${error}`,
    };
    await this.adapter.addWorkflowLog(id, log);

    return this.getRun(id);
  }

  // Cancel a workflow run
  async cancelRun(id: string): Promise<WorkflowRun | undefined> {
    const run = await this.getRun(id);
    if (!run) return undefined;

    if (!['queued', 'assigned', 'running', 'waiting'].includes(run.status)) {
      return undefined;
    }

    const now = new Date().toISOString();
    const updatedRun: Partial<WorkflowRun> = {
      status: 'canceled',
      endedAt: now,
    };

    await this.adapter.updateWorkflowRun(id, updatedRun);

    const log: WorkflowLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      level: 'warn',
      message: 'Workflow canceled by user',
    };
    await this.adapter.addWorkflowLog(id, log);

    return this.getRun(id);
  }

  // List all workflow runs with optional filters
  async listRuns(filters?: {
    status?: WorkflowRun['status'] | WorkflowRun['status'][];
    agent?: string;
    workflowId?: string;
    after?: string;
    before?: string;
  }): Promise<WorkflowRun[]> {
    return this.adapter.listWorkflowRuns(filters);
  }

  // Get runs by status
  async getRunsByStatus(status: WorkflowRun['status']): Promise<WorkflowRun[]> {
    return this.listRuns({ status });
  }

  // Get active runs
  async getActiveRuns(): Promise<WorkflowRun[]> {
    return this.listRuns({ status: ['queued', 'assigned', 'running', 'waiting'] });
  }

  // Get recent runs (last 24 hours)
  async getRecentRuns(): Promise<WorkflowRun[]> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this.listRuns({ after: yesterday.toISOString() });
  }

  // Delete a workflow run
  async deleteRun(id: string): Promise<boolean> {
    // Note: remove method may not exist on adapter
    // This is a placeholder for future implementation
    console.warn('deleteRun not fully implemented for database store');
    return false;
  }

  // Clear all runs
  async clearAll(): Promise<void> {
    // This would require a more complex implementation
    // For now, we'll just clear the table
    throw new Error('Clear all not implemented for database store');
  }

  // Get stats
  async getStats(): Promise<{
    total: number;
    byStatus: Record<WorkflowRun['status'], number>;
    byAgent: Record<string, number>;
  }> {
    return this.adapter.getStats();
  }

  // Subscribe to events (using realtime)
  on(event: string, callback: (run: WorkflowRun) => void): () => void {
    // For now, return a no-op unsubscribe
    // Real implementation would use Supabase realtime
    console.warn('DatabaseStore.on() not fully implemented');
    return () => {};
  }

  onAll(callback: (run: WorkflowRun) => void): () => void {
    const unsubscribe = this.adapter.subscribeToWorkflowRuns((payload) => {
      callback(payload.run);
    });
    return unsubscribe;
  }
}

// Factory function to create the appropriate store
export function createWorkflowStore(adapter?: SupabaseAdapter) {
  if (adapter) {
    return new DatabaseStore(adapter);
  }
  // Fall back to in-memory store
  const { workflowStore } = require('./workflowStore');
  return workflowStore;
}
