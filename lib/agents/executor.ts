import { WorkflowRun, WorkflowLog, AgentExecutionResponse } from '@/lib/types';
import { workflowStore } from '@/lib/store/workflowStore';
import { getAgentById, updateAgentStatus } from './registry';
import { handleEdgePilot } from './handlers/edgepilot';
import { handleDeepForge } from './handlers/deepforge';
import { handleScriptForge } from './handlers/scriptforge';
import { handleGrowthForge } from './handlers/growthforge';
import { handleBuildForge } from './handlers/buildforge';
import { handleSignalForge } from './handlers/signalforge';
import { JobQueue, memoryQueue } from '@/lib/queue/memory';
import { notificationService } from '@/lib/services/notifications';
import { metrics, recordWorkflowExecution, recordAgentUtilization, recordError } from '@/lib/services';
import { llmFactory } from '@/lib/adapters/llm/factory';
import { auditLogger } from '@/lib/audit';
import { withRetry, RetryConfig, deadLetterQueue, CircuitBreaker } from './retry';

// Agent handler mapping
const agentHandlers: Record<string, (run: WorkflowRun) => Promise<AgentExecutionResponse>> = {
  edgepilot: handleEdgePilot,
  deepforge: handleDeepForge,
  scriptforge: handleScriptForge,
  growthforge: handleGrowthForge,
  buildforge: handleBuildForge,
  signalforge: handleSignalForge,
};

// Circuit breakers for each agent
const circuitBreakers: Map<string, CircuitBreaker> = new Map();

// Get or create circuit breaker for agent
function getCircuitBreaker(agentId: string): CircuitBreaker {
  if (!circuitBreakers.has(agentId)) {
    circuitBreakers.set(agentId, new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 30000 }));
  }
  return circuitBreakers.get(agentId)!;
}

// Queue for async execution
let jobQueue: JobQueue = memoryQueue;

// Set the job queue (for dependency injection)
export function setJobQueue(queue: JobQueue): void {
  jobQueue = queue;
  
  // Set up job processor
  jobQueue.process(async (job) => {
    if (job.type === 'execute-workflow') {
      await executeWorkflowInternal(job.payload.runId);
    }
  });
}

// Execute a workflow run (queue or immediate)
export async function executeWorkflow(
  runId: string,
  options?: { immediate?: boolean; retryConfig?: Partial<RetryConfig> }
): Promise<AgentExecutionResponse> {
  const run = workflowStore.getRun(runId);
  if (!run) {
    return {
      success: false,
      agentId: 'system',
      workflowId: runId,
      summary: 'Workflow run not found',
      output: {},
      logs: [{
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Workflow run ${runId} not found in store`,
      }],
      timestamp: new Date().toISOString(),
    };
  }

  // Check if workflow is waiting for approval
  const { approvalStore } = await import('@/lib/workflows/approval');
  const pendingApproval = approvalStore.getByWorkflowRunId(runId);
  if (pendingApproval && pendingApproval.status === 'pending') {
    return {
      success: false,
      agentId: run.assignedAgent,
      workflowId: runId,
      summary: 'Workflow is waiting for approval',
      output: { approvalId: pendingApproval.id },
      logs: [{
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: 'warn',
        message: `Workflow paused for approval: ${pendingApproval.description}`,
      }],
      timestamp: new Date().toISOString(),
    };
  }

  if (options?.immediate) {
    return executeWorkflowInternal(runId, options.retryConfig);
  }

  // Queue for async execution
  await jobQueue.add({
    id: `job-${runId}`,
    type: 'execute-workflow',
    payload: { runId },
    priority: 1,
  });

  // Log workflow started
  auditLogger.logWorkflowAction('workflow_started', runId, 'system', {
    agentId: run.assignedAgent,
    workflowName: run.workflowName,
  });

  return {
    success: true,
    agentId: 'system',
    workflowId: runId,
    summary: 'Workflow queued for execution',
    output: { queued: true },
    logs: [{
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Workflow queued for async execution',
    }],
    timestamp: new Date().toISOString(),
  };
}

// Internal execution function with retry logic
async function executeWorkflowInternal(
  runId: string,
  retryConfig?: Partial<RetryConfig>
): Promise<AgentExecutionResponse> {
  const run = workflowStore.getRun(runId);
  if (!run) {
    return {
      success: false,
      agentId: 'system',
      workflowId: runId,
      summary: 'Workflow run not found',
      output: {},
      logs: [{
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Workflow run ${runId} not found in store`,
      }],
      timestamp: new Date().toISOString(),
    };
  }

  const startTime = Date.now();

  // Check circuit breaker
  const circuitBreaker = getCircuitBreaker(run.assignedAgent);
  if (circuitBreaker.isOpen()) {
    const error = 'Circuit breaker is open - too many failures';
    workflowStore.failRun(runId, error);
    
    auditLogger.logWorkflowAction('workflow_failed', runId, 'system', {
      error,
      agentId: run.assignedAgent,
    });

    return {
      success: false,
      agentId: run.assignedAgent,
      workflowId: runId,
      summary: error,
      output: {},
      logs: [{
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: 'error',
        message: error,
        agent: run.assignedAgent,
      }],
      timestamp: new Date().toISOString(),
    };
  }

  // Update status to running
  workflowStore.updateRun(runId, { status: 'running' });
  updateAgentStatus(run.assignedAgent, 'working', runId);
  recordAgentUtilization(run.assignedAgent, 1);

  // Log agent status change
  auditLogger.logAgentStatusChange(run.assignedAgent, 'idle', 'working', 'system', runId);

  // Add start log
  workflowStore.addLog(runId, {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    level: 'info',
    message: `Starting workflow execution: ${run.workflowName}`,
    agent: run.assignedAgent,
  });

  try {
    // Get the appropriate handler
    const handler = agentHandlers[run.assignedAgent];
    if (!handler) {
      throw new Error(`No handler found for agent: ${run.assignedAgent}`);
    }

    // Execute with retry logic
    const response = await withRetry(
      () => handler(run),
      {
        ...retryConfig,
        onRetry: (attempt, error) => {
          const retryCount = (run.retryCount || 0) + attempt;
          workflowStore.updateRun(runId, { retryCount });
          
          workflowStore.addLog(runId, {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            level: 'warn',
            message: `Retry attempt ${attempt} after error: ${error.message}`,
            agent: run.assignedAgent,
            metadata: { attempt, error: error.message },
          });
        },
      }
    );

    const duration = Date.now() - startTime;
    const durationStr = formatDuration(duration);

    // Record success in circuit breaker
    circuitBreaker.recordSuccess();

    // Update workflow based on response
    if (response.success) {
      workflowStore.completeRun(runId, {
        summary: response.summary,
        data: response.output,
        recommendations: response.nextRecommendedAction ? [response.nextRecommendedAction] : undefined,
      });
      updateAgentStatus(run.assignedAgent, 'idle');
      recordAgentUtilization(run.assignedAgent, 0);
      recordWorkflowExecution(run.workflowId, duration, true);

      // Log completion
      auditLogger.logWorkflowAction('workflow_completed', runId, 'system', {
        agentId: run.assignedAgent,
        duration: durationStr,
        summary: response.summary,
      });

      // Log agent status change
      auditLogger.logAgentStatusChange(run.assignedAgent, 'working', 'idle', 'system');

      // Send notification
      await notificationService.workflowCompleted(
        run.workflowName,
        runId,
        response.summary,
        durationStr,
        response.output
      );
    } else {
      throw new Error(response.summary);
    }

    // Add response logs to workflow
    response.logs.forEach((log) => {
      workflowStore.addLog(runId, log);
    });

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const duration = Date.now() - startTime;
    const durationStr = formatDuration(duration);

    // Record failure in circuit breaker
    circuitBreaker.recordFailure();

    // Update retry count
    const retryCount = (run.retryCount || 0) + 1;
    workflowStore.updateRun(runId, { retryCount });

    // Check if we should add to dead letter queue
    const maxRetries = retryConfig?.maxRetries || 3;
    if (retryCount >= maxRetries) {
      deadLetterQueue.add({
        runId,
        agentId: run.assignedAgent,
        error: errorMessage,
        retryCount,
        lastError: errorMessage,
        input: run.input,
      });
    }

    workflowStore.failRun(runId, errorMessage);
    updateAgentStatus(run.assignedAgent, 'blocked');
    recordAgentUtilization(run.assignedAgent, 0);
    recordWorkflowExecution(run.workflowId, duration, false);
    recordError('execution', run.assignedAgent);

    // Log failure
    auditLogger.logWorkflowAction('workflow_failed', runId, 'system', {
      agentId: run.assignedAgent,
      error: errorMessage,
      retryCount,
      addedToDLQ: retryCount >= maxRetries,
    });

    // Log agent status change
    auditLogger.logAgentStatusChange(run.assignedAgent, 'working', 'blocked', 'system', runId);

    // Send notification
    await notificationService.workflowFailed(
      run.workflowName,
      runId,
      errorMessage,
      durationStr
    );

    return {
      success: false,
      agentId: run.assignedAgent,
      workflowId: runId,
      summary: `Execution failed: ${errorMessage}`,
      output: { retryCount, maxRetries },
      logs: [{
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: 'error',
        message: errorMessage,
        agent: run.assignedAgent,
      }],
      timestamp: new Date().toISOString(),
    };
  }
}

// Retry a failed workflow
export async function retryWorkflow(runId: string): Promise<AgentExecutionResponse> {
  const run = workflowStore.getRun(runId);
  if (!run) {
    return {
      success: false,
      agentId: 'system',
      workflowId: runId,
      summary: 'Workflow run not found',
      output: {},
      logs: [{
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Workflow run ${runId} not found`,
      }],
      timestamp: new Date().toISOString(),
    };
  }

  if (run.status !== 'failed' && run.status !== 'blocked') {
    return {
      success: false,
      agentId: run.assignedAgent,
      workflowId: runId,
      summary: `Cannot retry workflow with status: ${run.status}`,
      output: { currentStatus: run.status },
      logs: [{
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Cannot retry workflow with status: ${run.status}`,
      }],
      timestamp: new Date().toISOString(),
    };
  }

  // Reset status and retry
  workflowStore.updateRun(runId, { 
    status: 'queued',
    error: undefined,
    endedAt: undefined,
  });

  // Log retry
  auditLogger.logWorkflowAction('workflow_retried', runId, 'system', {
    agentId: run.assignedAgent,
    previousRetryCount: run.retryCount,
  });

  // Remove from dead letter queue if present
  const dlqEntries = deadLetterQueue.getAll().filter(e => e.runId === runId);
  dlqEntries.forEach(e => deadLetterQueue.remove(e.id));

  // Execute
  return executeWorkflow(runId, { immediate: true });
}

// Dispatch a job to an agent
export async function dispatchToAgent(
  agentId: string,
  jobType: string,
  input: Record<string, any>,
  workflowId?: string
): Promise<AgentExecutionResponse> {
  const agent = getAgentById(agentId);
  if (!agent) {
    return {
      success: false,
      agentId: 'system',
      workflowId: workflowId || 'unknown',
      summary: `Agent ${agentId} not found`,
      output: {},
      logs: [{
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Agent ${agentId} not found in registry`,
      }],
      timestamp: new Date().toISOString(),
    };
  }

  // Create a workflow run for this dispatch
  const { workflowDefinitions } = await import('@/lib/workflows/definitions');
  
  const run = workflowStore.createRun(
    {
      id: workflowId || `wf-${Date.now()}`,
      name: jobType,
      description: `Direct dispatch to ${agent.displayName}`,
      defaultAgent: agentId,
      steps: [],
      inputSchema: {},
      outputSchema: {},
    },
    input,
    agentId
  );

  // Execute the workflow
  return executeWorkflow(run.id);
}

// Create and execute a new workflow
export async function createAndExecuteWorkflow(
  workflowDefinitionId: string,
  input: Record<string, any>,
  preferredAgent?: string,
  options?: { immediate?: boolean }
): Promise<AgentExecutionResponse> {
  const { workflowDefinitions } = await import('@/lib/workflows/definitions');
  
  const definition = workflowDefinitions.find((d) => d.id === workflowDefinitionId);
  if (!definition) {
    return {
      success: false,
      agentId: 'system',
      workflowId: workflowDefinitionId,
      summary: `Workflow definition ${workflowDefinitionId} not found`,
      output: {},
      logs: [{
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Workflow definition ${workflowDefinitionId} not found`,
      }],
      timestamp: new Date().toISOString(),
    };
  }

  const agentId = preferredAgent || definition.defaultAgent;
  const run = workflowStore.createRun(definition, input, agentId);

  // Log creation
  auditLogger.logWorkflowAction('workflow_created', run.id, 'system', {
    workflowDefinitionId,
    agentId,
    input,
  });
  
  return executeWorkflow(run.id, options);
}

// Helper function to format duration
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

// Export LLM factory for use in handlers
export { llmFactory };
