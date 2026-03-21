export interface ApprovalGate {
  id: string;
  workflowRunId: string;
  stepName: string;
  description: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  decidedBy?: string;
  decidedAt?: string;
  comments?: string;
  inputData?: Record<string, any>;
  outputData?: Record<string, any>;
}

// Approval store for managing approval gates
class ApprovalStore {
  private approvals: Map<string, ApprovalGate> = new Map();
  private listeners: Set<(approval: ApprovalGate) => void> = new Set();

  // Create a new approval request
  createApproval(
    workflowRunId: string,
    stepName: string,
    description: string,
    requestedBy: string,
    inputData?: Record<string, any>
  ): ApprovalGate {
    const id = `approval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const approval: ApprovalGate = {
      id,
      workflowRunId,
      stepName,
      description,
      requestedBy,
      requestedAt: new Date().toISOString(),
      status: 'pending',
      inputData,
    };

    this.approvals.set(id, approval);
    this.notifyListeners(approval);
    return approval;
  }

  // Get an approval by ID
  getApproval(id: string): ApprovalGate | undefined {
    return this.approvals.get(id);
  }

  // Get approval by workflow run ID
  getByWorkflowRunId(workflowRunId: string): ApprovalGate | undefined {
    return Array.from(this.approvals.values()).find(
      a => a.workflowRunId === workflowRunId && a.status === 'pending'
    );
  }

  // Approve a request
  approve(
    id: string,
    decidedBy: string,
    comments?: string,
    outputData?: Record<string, any>
  ): ApprovalGate | undefined {
    const approval = this.approvals.get(id);
    if (!approval || approval.status !== 'pending') {
      return undefined;
    }

    const updatedApproval: ApprovalGate = {
      ...approval,
      status: 'approved',
      decidedBy,
      decidedAt: new Date().toISOString(),
      comments,
      outputData,
    };

    this.approvals.set(id, updatedApproval);
    this.notifyListeners(updatedApproval);
    return updatedApproval;
  }

  // Reject a request
  reject(
    id: string,
    decidedBy: string,
    comments?: string
  ): ApprovalGate | undefined {
    const approval = this.approvals.get(id);
    if (!approval || approval.status !== 'pending') {
      return undefined;
    }

    const updatedApproval: ApprovalGate = {
      ...approval,
      status: 'rejected',
      decidedBy,
      decidedAt: new Date().toISOString(),
      comments,
    };

    this.approvals.set(id, updatedApproval);
    this.notifyListeners(updatedApproval);
    return updatedApproval;
  }

  // List all approvals with optional filters
  list(filters?: { status?: ApprovalGate['status']; workflowRunId?: string }): ApprovalGate[] {
    let approvals = Array.from(this.approvals.values());

    if (filters?.status) {
      approvals = approvals.filter(a => a.status === filters.status);
    }
    if (filters?.workflowRunId) {
      approvals = approvals.filter(a => a.workflowRunId === filters.workflowRunId);
    }

    return approvals.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }

  // Get pending approvals
  getPending(): ApprovalGate[] {
    return this.list({ status: 'pending' });
  }

  // Get approval history (decided approvals)
  getHistory(): ApprovalGate[] {
    return this.list().filter(a => a.status !== 'pending');
  }

  // Delete an approval
  delete(id: string): boolean {
    return this.approvals.delete(id);
  }

  // Subscribe to approval changes
  subscribe(callback: (approval: ApprovalGate) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify listeners of changes
  private notifyListeners(approval: ApprovalGate): void {
    this.listeners.forEach(callback => {
      try {
        callback(approval);
      } catch (error) {
        console.error('Error in approval listener:', error);
      }
    });
  }

  // Get stats
  getStats(): { pending: number; approved: number; rejected: number; total: number } {
    const approvals = Array.from(this.approvals.values());
    return {
      pending: approvals.filter(a => a.status === 'pending').length,
      approved: approvals.filter(a => a.status === 'approved').length,
      rejected: approvals.filter(a => a.status === 'rejected').length,
      total: approvals.length,
    };
  }

  // Check if workflow run is waiting for approval
  isWaitingForApproval(workflowRunId: string): boolean {
    return this.approvals.has(workflowRunId) && 
           this.approvals.get(workflowRunId)?.status === 'pending';
  }
}

// Export singleton instance
export const approvalStore = new ApprovalStore();
