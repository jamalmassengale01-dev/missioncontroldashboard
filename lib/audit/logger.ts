import { AuditEvent, AuditAction } from './types';
import { auditStore } from './store';

// Logger for audit events
class AuditLogger {
  // Log a workflow action
  logWorkflowAction(
    action: Extract<AuditAction, 'workflow_created' | 'workflow_started' | 'workflow_completed' | 'workflow_failed' | 'workflow_canceled' | 'workflow_reassigned' | 'workflow_retried'>,
    workflowRunId: string,
    actor: string,
    details: Record<string, any> = {},
    metadata: { ip?: string; userAgent?: string } = {}
  ): AuditEvent {
    return auditStore.addEvent({
      actor,
      action,
      resource: 'workflow',
      resourceId: workflowRunId,
      details,
      ip: metadata.ip,
      userAgent: metadata.userAgent,
    });
  }

  // Log agent status change
  logAgentStatusChange(
    agentId: string,
    oldStatus: string,
    newStatus: string,
    actor: string = 'system',
    workflowRunId?: string,
    metadata: { ip?: string; userAgent?: string } = {}
  ): AuditEvent {
    return auditStore.addEvent({
      actor,
      action: 'agent_status_changed',
      resource: 'agent',
      resourceId: agentId,
      details: {
        oldStatus,
        newStatus,
        workflowRunId,
      },
      ip: metadata.ip,
      userAgent: metadata.userAgent,
    });
  }

  // Log config change
  logConfigChange(
    configKey: string,
    oldValue: any,
    newValue: any,
    actor: string,
    metadata: { ip?: string; userAgent?: string } = {}
  ): AuditEvent {
    return auditStore.addEvent({
      actor,
      action: 'config_changed',
      resource: 'config',
      resourceId: configKey,
      details: {
        oldValue,
        newValue,
      },
      ip: metadata.ip,
      userAgent: metadata.userAgent,
    });
  }

  // Log authentication
  logLogin(
    username: string,
    success: boolean,
    metadata: { ip?: string; userAgent?: string } = {}
  ): AuditEvent {
    return auditStore.addEvent({
      actor: username,
      action: success ? 'login' : 'login_failed',
      resource: 'auth',
      resourceId: username,
      details: { success },
      ip: metadata.ip,
      userAgent: metadata.userAgent,
    });
  }

  logLogout(
    username: string,
    metadata: { ip?: string; userAgent?: string } = {}
  ): AuditEvent {
    return auditStore.addEvent({
      actor: username,
      action: 'logout',
      resource: 'auth',
      resourceId: username,
      details: {},
      ip: metadata.ip,
      userAgent: metadata.userAgent,
    });
  }

  // Log approval action
  logApprovalAction(
    action: 'approval_requested' | 'approval_decided',
    approvalId: string,
    workflowRunId: string,
    actor: string,
    details: Record<string, any> = {},
    metadata: { ip?: string; userAgent?: string } = {}
  ): AuditEvent {
    return auditStore.addEvent({
      actor,
      action,
      resource: 'approval',
      resourceId: approvalId,
      details: {
        workflowRunId,
        ...details,
      },
      ip: metadata.ip,
      userAgent: metadata.userAgent,
    });
  }

  // Log chain step completion
  logChainStep(
    chainId: string,
    stepId: string,
    stepNumber: number,
    totalSteps: number,
    actor: string = 'system',
    metadata: { ip?: string; userAgent?: string } = {}
  ): AuditEvent {
    return auditStore.addEvent({
      actor,
      action: 'chain_step_completed',
      resource: 'chain',
      resourceId: chainId,
      details: {
        stepId,
        stepNumber,
        totalSteps,
      },
      ip: metadata.ip,
      userAgent: metadata.userAgent,
    });
  }

  // Log LLM provider switch
  logLLMProviderSwitch(
    fromProvider: string,
    toProvider: string,
    reason: string,
    actor: string = 'system',
    metadata: { ip?: string; userAgent?: string } = {}
  ): AuditEvent {
    return auditStore.addEvent({
      actor,
      action: 'llm_provider_switched',
      resource: 'llm',
      resourceId: toProvider,
      details: {
        fromProvider,
        toProvider,
        reason,
      },
      ip: metadata.ip,
      userAgent: metadata.userAgent,
    });
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();
