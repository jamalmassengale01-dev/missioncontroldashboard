export interface ChainStep {
  id: string;
  agent: string;
  inputMapping: Record<string, string>;
  outputMapping: Record<string, string>;
  condition?: string;
}

export interface WorkflowChain {
  id: string;
  name: string;
  steps: ChainStep[];
  currentStep: number;
  sharedContext: Record<string, any>;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  parentRunId?: string;
  childRunIds: string[];
  startedAt: string;
  endedAt?: string;
}

export interface ChainExecutionResult {
  success: boolean;
  chainId: string;
  completedSteps: number;
  totalSteps: number;
  outputs: Record<string, any>;
  error?: string;
}

// Chain store for managing workflow chains
class ChainStore {
  private chains: Map<string, WorkflowChain> = new Map();

  // Create a new workflow chain
  createChain(
    name: string,
    steps: ChainStep[],
    initialContext: Record<string, any> = {},
    parentRunId?: string
  ): WorkflowChain {
    const id = `chain-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const chain: WorkflowChain = {
      id,
      name,
      steps,
      currentStep: 0,
      sharedContext: initialContext,
      status: 'pending',
      parentRunId,
      childRunIds: [],
      startedAt: new Date().toISOString(),
    };

    this.chains.set(id, chain);
    return chain;
  }

  // Get a chain by ID
  getChain(id: string): WorkflowChain | undefined {
    return this.chains.get(id);
  }

  // Update a chain
  updateChain(id: string, updates: Partial<WorkflowChain>): WorkflowChain | undefined {
    const chain = this.chains.get(id);
    if (!chain) return undefined;

    const updatedChain = { ...chain, ...updates };
    this.chains.set(id, updatedChain);
    return updatedChain;
  }

  // Advance to next step
  advanceStep(id: string, stepOutput: Record<string, any>): WorkflowChain | undefined {
    const chain = this.chains.get(id);
    if (!chain) return undefined;

    const currentStep = chain.steps[chain.currentStep];
    if (!currentStep) return undefined;

    // Map outputs to shared context based on outputMapping
    const updatedContext = { ...chain.sharedContext };
    for (const [key, value] of Object.entries(currentStep.outputMapping)) {
      if (stepOutput[key] !== undefined) {
        updatedContext[value] = stepOutput[key];
      }
    }

    // Add step-specific outputs
    updatedContext[`step_${chain.currentStep}_output`] = stepOutput;

    const nextStep = chain.currentStep + 1;
    const isComplete = nextStep >= chain.steps.length;

    const updatedChain: WorkflowChain = {
      ...chain,
      currentStep: nextStep,
      sharedContext: updatedContext,
      status: isComplete ? 'completed' : 'running',
      endedAt: isComplete ? new Date().toISOString() : undefined,
    };

    this.chains.set(id, updatedChain);
    return updatedChain;
  }

  // Evaluate condition for conditional branching
  evaluateCondition(condition: string, context: Record<string, any>): boolean {
    try {
      // Simple condition evaluation - supports basic comparisons
      // In production, use a proper expression evaluator
      const evalContext = { ...context, _result: true };
      
      // Replace variable references with actual values
      let evalString = condition;
      for (const [key, value] of Object.entries(context)) {
        const stringValue = typeof value === 'string' ? `"${value}"` : String(value);
        evalString = evalString.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), stringValue);
        evalString = evalString.replace(new RegExp(`\\$${key}\\b`, 'g'), stringValue);
      }

      // Simple evaluation for common patterns
      if (evalString.includes('===')) {
        const [left, right] = evalString.split('===').map(s => s.trim());
        return left === right;
      }
      if (evalString.includes('==')) {
        const [left, right] = evalString.split('==').map(s => s.trim());
        return left == right;
      }
      if (evalString.includes('>')) {
        const [left, right] = evalString.split('>').map(s => parseFloat(s.trim()));
        return left > right;
      }
      if (evalString.includes('<')) {
        const [left, right] = evalString.split('<').map(s => parseFloat(s.trim()));
        return left < right;
      }

      // Default to true if we can't evaluate
      return true;
    } catch {
      return true;
    }
  }

  // Check if current step should be skipped based on condition
  shouldSkipCurrentStep(chain: WorkflowChain): boolean {
    const step = chain.steps[chain.currentStep];
    if (!step || !step.condition) {
      return false;
    }
    return !this.evaluateCondition(step.condition, chain.sharedContext);
  }

  // Prepare input for current step based on inputMapping
  prepareStepInput(chain: WorkflowChain): Record<string, any> {
    const step = chain.steps[chain.currentStep];
    if (!step) return {};

    const input: Record<string, any> = {};
    for (const [targetKey, sourceKey] of Object.entries(step.inputMapping)) {
      if (chain.sharedContext[sourceKey] !== undefined) {
        input[targetKey] = chain.sharedContext[sourceKey];
      }
    }

    return input;
  }

  // Pause a chain
  pauseChain(id: string): WorkflowChain | undefined {
    return this.updateChain(id, { status: 'paused' });
  }

  // Resume a chain
  resumeChain(id: string): WorkflowChain | undefined {
    const chain = this.chains.get(id);
    if (!chain || chain.status !== 'paused') return undefined;

    return this.updateChain(id, { status: 'running' });
  }

  // Fail a chain
  failChain(id: string, error: string): WorkflowChain | undefined {
    return this.updateChain(id, { 
      status: 'failed', 
      endedAt: new Date().toISOString(),
      sharedContext: {
        ...this.chains.get(id)?.sharedContext,
        _error: error,
      },
    });
  }

  // List all chains
  listChains(filters?: { status?: WorkflowChain['status']; parentRunId?: string }): WorkflowChain[] {
    let chains = Array.from(this.chains.values());

    if (filters?.status) {
      chains = chains.filter(c => c.status === filters.status);
    }
    if (filters?.parentRunId) {
      chains = chains.filter(c => c.parentRunId === filters.parentRunId);
    }

    return chains.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  // Get active chains
  getActiveChains(): WorkflowChain[] {
    return this.listChains({ status: 'running' });
  }

  // Delete a chain
  deleteChain(id: string): boolean {
    return this.chains.delete(id);
  }

  // Get chain progress as percentage
  getProgress(chainId: string): number {
    const chain = this.chains.get(chainId);
    if (!chain) return 0;
    if (chain.steps.length === 0) return 100;
    return Math.round((chain.currentStep / chain.steps.length) * 100);
  }
}

// Export singleton instance
export const chainStore = new ChainStore();
