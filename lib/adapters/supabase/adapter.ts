import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { BaseAdapter, AdapterHealth } from '../base';
import { SupabaseConfig } from './config';
import { WorkflowRun, WorkflowLog, WorkflowDefinition } from '@/lib/types';

export class SupabaseAdapter extends BaseAdapter<SupabaseConfig> {
  id = 'supabase';
  name = 'Supabase Database Adapter';
  version = '1.0.0';

  private client?: SupabaseClient;
  private realtimeChannels: Map<string, RealtimeChannel> = new Map();

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.client = createClient(
      this.config.url,
      this.config.serviceRoleKey || this.config.anonKey,
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Test connection
    const { error } = await this.client.from('workflows').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist
      throw new Error(`Supabase connection failed: ${error.message}`);
    }

    this.isInitialized = true;
    console.log('[SupabaseAdapter] Initialized');
  }

  async dispose(): Promise<void> {
    // Unsubscribe from all realtime channels
    this.realtimeChannels.forEach((channel) => {
      channel.unsubscribe();
    });
    this.realtimeChannels.clear();

    this.client = undefined;
    this.isInitialized = false;
  }

  async health(): Promise<AdapterHealth> {
    if (!this.client) {
      return {
        status: 'unhealthy',
        lastError: 'Client not initialized',
        lastChecked: new Date(),
      };
    }

    const start = Date.now();
    try {
      const { error } = await this.client.from('workflows').select('count', { count: 'exact', head: true });
      if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
      }
      return {
        status: 'healthy',
        latency: Date.now() - start,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - start,
        lastError: error instanceof Error ? error.message : 'Health check failed',
        lastChecked: new Date(),
      };
    }
  }

  // Workflow operations
  async createWorkflowRun(run: WorkflowRun): Promise<void> {
    if (!this.client) throw new Error('Supabase client not initialized');

    const { error } = await this.client.from('workflow_runs').insert({
      id: run.id,
      workflow_id: run.workflowId,
      workflow_name: run.workflowName,
      assigned_agent: run.assignedAgent,
      input: run.input,
      status: run.status,
      started_at: run.startedAt,
      ended_at: run.endedAt,
      output: run.output,
      error: run.error,
      retry_count: run.retryCount,
      parent_run_id: run.parentRunId,
      child_run_ids: run.childRunIds,
    });

    if (error) throw new Error(`Failed to create workflow run: ${error.message}`);
  }

  async getWorkflowRun(id: string): Promise<WorkflowRun | null> {
    if (!this.client) throw new Error('Supabase client not initialized');

    const { data, error } = await this.client
      .from('workflow_runs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get workflow run: ${error.message}`);
    }

    return this.mapWorkflowRun(data);
  }

  async updateWorkflowRun(id: string, updates: Partial<WorkflowRun>): Promise<void> {
    if (!this.client) throw new Error('Supabase client not initialized');

    const dbUpdates: Record<string, any> = {};
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.endedAt) dbUpdates.ended_at = updates.endedAt;
    if (updates.output) dbUpdates.output = updates.output;
    if (updates.error) dbUpdates.error = updates.error;
    if (updates.retryCount !== undefined) dbUpdates.retry_count = updates.retryCount;

    const { error } = await this.client.from('workflow_runs').update(dbUpdates).eq('id', id);

    if (error) throw new Error(`Failed to update workflow run: ${error.message}`);
  }

  async listWorkflowRuns(filters?: {
    status?: string | string[];
    agent?: string;
    workflowId?: string;
    after?: string;
    before?: string;
  }): Promise<WorkflowRun[]> {
    if (!this.client) throw new Error('Supabase client not initialized');

    let query = this.client.from('workflow_runs').select('*');

    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    if (filters?.agent) {
      query = query.eq('assigned_agent', filters.agent);
    }

    if (filters?.workflowId) {
      query = query.eq('workflow_id', filters.workflowId);
    }

    if (filters?.after) {
      query = query.gte('started_at', filters.after);
    }

    if (filters?.before) {
      query = query.lte('started_at', filters.before);
    }

    const { data, error } = await query.order('started_at', { ascending: false });

    if (error) throw new Error(`Failed to list workflow runs: ${error.message}`);

    return (data || []).map(this.mapWorkflowRun);
  }

  // Workflow log operations
  async addWorkflowLog(runId: string, log: WorkflowLog): Promise<void> {
    if (!this.client) throw new Error('Supabase client not initialized');

    const { error } = await this.client.from('workflow_logs').insert({
      id: log.id,
      run_id: runId,
      timestamp: log.timestamp,
      level: log.level,
      message: log.message,
      agent: log.agent,
      metadata: log.metadata,
    });

    if (error) throw new Error(`Failed to add workflow log: ${error.message}`);
  }

  async getWorkflowLogs(runId: string): Promise<WorkflowLog[]> {
    if (!this.client) throw new Error('Supabase client not initialized');

    const { data, error } = await this.client
      .from('workflow_logs')
      .select('*')
      .eq('run_id', runId)
      .order('timestamp', { ascending: true });

    if (error) throw new Error(`Failed to get workflow logs: ${error.message}`);

    return (data || []).map(this.mapWorkflowLog);
  }

  // Workflow definition operations
  async saveWorkflowDefinition(definition: WorkflowDefinition): Promise<void> {
    if (!this.client) throw new Error('Supabase client not initialized');

    const { error } = await this.client.from('workflows').upsert({
      id: definition.id,
      name: definition.name,
      description: definition.description,
      default_agent: definition.defaultAgent,
      steps: definition.steps,
      input_schema: definition.inputSchema,
      output_schema: definition.outputSchema,
      updated_at: new Date().toISOString(),
    });

    if (error) throw new Error(`Failed to save workflow definition: ${error.message}`);
  }

  async getWorkflowDefinition(id: string): Promise<WorkflowDefinition | null> {
    if (!this.client) throw new Error('Supabase client not initialized');

    const { data, error } = await this.client
      .from('workflows')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get workflow definition: ${error.message}`);
    }

    return this.mapWorkflowDefinition(data);
  }

  async listWorkflowDefinitions(): Promise<WorkflowDefinition[]> {
    if (!this.client) throw new Error('Supabase client not initialized');

    const { data, error } = await this.client.from('workflows').select('*');

    if (error) throw new Error(`Failed to list workflow definitions: ${error.message}`);

    return (data || []).map(this.mapWorkflowDefinition);
  }

  // Realtime subscriptions
  subscribeToWorkflowRuns(
    callback: (payload: { event: 'INSERT' | 'UPDATE' | 'DELETE'; run: WorkflowRun }) => void
  ): () => void {
    if (!this.client) throw new Error('Supabase client not initialized');

    const channel = this.client
      .channel('workflow_runs_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'workflow_runs' },
        (payload) => {
          callback({
            event: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            run: this.mapWorkflowRun(payload.new),
          });
        }
      )
      .subscribe();

    this.realtimeChannels.set('workflow_runs', channel);

    return () => {
      channel.unsubscribe();
      this.realtimeChannels.delete('workflow_runs');
    };
  }

  // Stats
  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byAgent: Record<string, number>;
  }> {
    if (!this.client) throw new Error('Supabase client not initialized');

    const { data, error } = await this.client.from('workflow_runs').select('status, assigned_agent');

    if (error) throw new Error(`Failed to get stats: ${error.message}`);

    const byStatus: Record<string, number> = {};
    const byAgent: Record<string, number> = {};

    (data || []).forEach((row) => {
      byStatus[row.status] = (byStatus[row.status] || 0) + 1;
      byAgent[row.assigned_agent] = (byAgent[row.assigned_agent] || 0) + 1;
    });

    return {
      total: data?.length || 0,
      byStatus,
      byAgent,
    };
  }

  // Mappers
  private mapWorkflowRun(data: any): WorkflowRun {
    return {
      id: data.id,
      workflowId: data.workflow_id,
      workflowName: data.workflow_name,
      assignedAgent: data.assigned_agent,
      input: data.input || {},
      status: data.status,
      startedAt: data.started_at,
      endedAt: data.ended_at,
      output: data.output,
      logs: [], // Logs are fetched separately
      error: data.error,
      retryCount: data.retry_count || 0,
      parentRunId: data.parent_run_id,
      childRunIds: data.child_run_ids,
    };
  }

  private mapWorkflowLog(data: any): WorkflowLog {
    return {
      id: data.id,
      timestamp: data.timestamp,
      level: data.level,
      message: data.message,
      agent: data.agent,
      metadata: data.metadata,
    };
  }

  private mapWorkflowDefinition(data: any): WorkflowDefinition {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      defaultAgent: data.default_agent,
      steps: data.steps || [],
      inputSchema: data.input_schema || {},
      outputSchema: data.output_schema || {},
    };
  }
}
