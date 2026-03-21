import { WorkflowRun, WorkflowLog, WorkflowDefinition, WorkflowOutput } from '@/lib/types';

// Event emitter for real-time updates
type EventCallback = (run: WorkflowRun) => void;

class WorkflowStore {
  private runs: Map<string, WorkflowRun> = new Map();
  private eventListeners: Map<string, EventCallback[]> = new Map();
  private globalListeners: EventCallback[] = [];

  // Create a new workflow run
  createRun(
    definition: WorkflowDefinition,
    input: Record<string, any>,
    assignedAgent: string
  ): WorkflowRun {
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

    this.runs.set(id, run);
    this.emit('created', run);
    this.emitGlobal(run);

    return run;
  }

  // Get a workflow run by ID
  getRun(id: string): WorkflowRun | undefined {
    return this.runs.get(id);
  }

  // Update a workflow run
  updateRun(id: string, updates: Partial<WorkflowRun>): WorkflowRun | undefined {
    const run = this.runs.get(id);
    if (!run) return undefined;

    const updatedRun = { ...run, ...updates };
    this.runs.set(id, updatedRun);
    this.emit('updated', updatedRun);
    this.emitGlobal(updatedRun);

    return updatedRun;
  }

  // Add a log entry to a workflow run
  addLog(runId: string, log: WorkflowLog): boolean {
    const run = this.runs.get(runId);
    if (!run) return false;

    run.logs.push(log);
    this.runs.set(runId, run);
    this.emit('log', run);
    this.emitGlobal(run);

    return true;
  }

  // Complete a workflow run
  completeRun(id: string, output: WorkflowOutput): WorkflowRun | undefined {
    const run = this.runs.get(id);
    if (!run) return undefined;

    const now = new Date().toISOString();
    const updatedRun: WorkflowRun = {
      ...run,
      status: 'completed',
      endedAt: now,
      output,
      logs: [
        ...run.logs,
        {
          id: `log-${Date.now()}`,
          timestamp: now,
          level: 'info',
          message: `Workflow completed successfully: ${output.summary}`,
        },
      ],
    };

    this.runs.set(id, updatedRun);
    this.emit('completed', updatedRun);
    this.emitGlobal(updatedRun);

    return updatedRun;
  }

  // Fail a workflow run
  failRun(id: string, error: string): WorkflowRun | undefined {
    const run = this.runs.get(id);
    if (!run) return undefined;

    const now = new Date().toISOString();
    const updatedRun: WorkflowRun = {
      ...run,
      status: 'failed',
      endedAt: now,
      error,
      logs: [
        ...run.logs,
        {
          id: `log-${Date.now()}`,
          timestamp: now,
          level: 'error',
          message: `Workflow failed: ${error}`,
        },
      ],
    };

    this.runs.set(id, updatedRun);
    this.emit('failed', updatedRun);
    this.emitGlobal(updatedRun);

    return updatedRun;
  }

  // Cancel a workflow run
  cancelRun(id: string): WorkflowRun | undefined {
    const run = this.runs.get(id);
    if (!run) return undefined;

    // Can only cancel queued, assigned, or running workflows
    if (!['queued', 'assigned', 'running', 'waiting'].includes(run.status)) {
      return undefined;
    }

    const now = new Date().toISOString();
    const updatedRun: WorkflowRun = {
      ...run,
      status: 'canceled',
      endedAt: now,
      logs: [
        ...run.logs,
        {
          id: `log-${Date.now()}`,
          timestamp: now,
          level: 'warn',
          message: 'Workflow canceled by user',
        },
      ],
    };

    this.runs.set(id, updatedRun);
    this.emit('canceled', updatedRun);
    this.emitGlobal(updatedRun);

    return updatedRun;
  }

  // List all workflow runs with optional filters
  listRuns(filters?: {
    status?: WorkflowRun['status'] | WorkflowRun['status'][];
    agent?: string;
    workflowId?: string;
    after?: string;
    before?: string;
  }): WorkflowRun[] {
    let runs = Array.from(this.runs.values());

    if (filters) {
      if (filters.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
        runs = runs.filter(r => statuses.includes(r.status));
      }

      if (filters.agent) {
        runs = runs.filter(r => r.assignedAgent === filters.agent);
      }

      if (filters.workflowId) {
        runs = runs.filter(r => r.workflowId === filters.workflowId);
      }

      if (filters.after) {
        runs = runs.filter(r => r.startedAt >= filters.after!);
      }

      if (filters.before) {
        runs = runs.filter(r => r.startedAt <= filters.before!);
      }
    }

    // Sort by startedAt descending (newest first)
    return runs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  // Get runs by status
  getRunsByStatus(status: WorkflowRun['status']): WorkflowRun[] {
    return this.listRuns({ status });
  }

  // Get active runs (queued, assigned, running, waiting)
  getActiveRuns(): WorkflowRun[] {
    return this.listRuns({ status: ['queued', 'assigned', 'running', 'waiting'] });
  }

  // Get recent runs (last 24 hours)
  getRecentRuns(): WorkflowRun[] {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this.listRuns({ after: yesterday.toISOString() });
  }

  // Delete a workflow run
  deleteRun(id: string): boolean {
    const existed = this.runs.has(id);
    this.runs.delete(id);
    return existed;
  }

  // Clear all runs (use with caution)
  clearAll(): void {
    this.runs.clear();
  }

  // Get stats
  getStats(): {
    total: number;
    byStatus: Record<WorkflowRun['status'], number>;
    byAgent: Record<string, number>;
  } {
    const runs = Array.from(this.runs.values());
    const byStatus: Record<string, number> = {
      queued: 0,
      assigned: 0,
      running: 0,
      waiting: 0,
      completed: 0,
      failed: 0,
      blocked: 0,
      canceled: 0,
    };
    const byAgent: Record<string, number> = {};

    runs.forEach(run => {
      byStatus[run.status] = (byStatus[run.status] || 0) + 1;
      byAgent[run.assignedAgent] = (byAgent[run.assignedAgent] || 0) + 1;
    });

    return {
      total: runs.length,
      byStatus: byStatus as Record<WorkflowRun['status'], number>,
      byAgent,
    };
  }

  // Subscribe to events
  on(event: string, callback: EventCallback): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  // Subscribe to all events
  onAll(callback: EventCallback): () => void {
    this.globalListeners.push(callback);

    return () => {
      const index = this.globalListeners.indexOf(callback);
      if (index > -1) {
        this.globalListeners.splice(index, 1);
      }
    };
  }

  // Emit event
  private emit(event: string, run: WorkflowRun): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(run);
        } catch (error) {
          console.error(`Error in workflow store event listener:`, error);
        }
      });
    }
  }

  // Emit to global listeners
  private emitGlobal(run: WorkflowRun): void {
    this.globalListeners.forEach(callback => {
      try {
        callback(run);
      } catch (error) {
        console.error(`Error in workflow store global listener:`, error);
      }
    });
  }
}

// Export singleton instance
export const workflowStore = new WorkflowStore();