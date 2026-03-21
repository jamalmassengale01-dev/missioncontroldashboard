export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  ip?: string;
  userAgent?: string;
}

export type AuditAction =
  | 'workflow_created'
  | 'workflow_started'
  | 'workflow_completed'
  | 'workflow_failed'
  | 'workflow_canceled'
  | 'workflow_reassigned'
  | 'workflow_retried'
  | 'agent_status_changed'
  | 'config_changed'
  | 'login'
  | 'logout'
  | 'approval_requested'
  | 'approval_decided'
  | 'chain_step_completed'
  | 'llm_provider_switched';

export interface AuditQuery {
  actor?: string;
  action?: AuditAction | AuditAction[];
  resource?: string;
  resourceId?: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
  offset?: number;
}
