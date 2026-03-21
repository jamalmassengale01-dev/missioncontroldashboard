import { WorkflowRun, AgentExecutionResponse, WorkflowLog } from '@/lib/types';

// EdgePilot: Orchestration and coordination agent
export async function handleEdgePilot(run: WorkflowRun): Promise<AgentExecutionResponse> {
  const logs: WorkflowLog[] = [];
  const timestamp = new Date().toISOString();

  logs.push({
    id: `log-${Date.now()}-1`,
    timestamp,
    level: 'info',
    message: 'EdgePilot analyzing request and planning workflow',
    agent: 'edgepilot',
  });

  const { input } = run;
  const jobType = input.jobType || 'orchestrate';
  const task = input.task || input.request || 'General coordination task';

  // Import selectAgentForJob dynamically to avoid circular dependency
  const { selectAgentForJob } = await import('../registry');
  const targetAgent = selectAgentForJob(jobType, input.preferredAgent);
  
  if (!targetAgent) {
    logs.push({
      id: `log-${Date.now()}-2`,
      timestamp: new Date().toISOString(),
      level: 'error',
      message: `No suitable agent found for job type: ${jobType}`,
      agent: 'edgepilot',
    });

    return {
      success: false,
      agentId: 'edgepilot',
      workflowId: run.id,
      summary: `Failed to route task: No agent available for job type "${jobType}"`,
      output: {},
      logs,
      timestamp: new Date().toISOString(),
    };
  }

  logs.push({
    id: `log-${Date.now()}-3`,
    timestamp: new Date().toISOString(),
    level: 'info',
    message: `Selected ${targetAgent.displayName} (${targetAgent.id}) for job type: ${jobType}`,
    agent: 'edgepilot',
    metadata: { targetAgent: targetAgent.id, jobType },
  });

  // Check if this is a multi-step workflow
  if (input.steps && Array.isArray(input.steps)) {
    logs.push({
      id: `log-${Date.now()}-4`,
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Executing multi-step workflow with ${input.steps.length} steps`,
      agent: 'edgepilot',
    });

    const results: Record<string, any> = {};
    
    for (let i = 0; i < input.steps.length; i++) {
      const step = input.steps[i];
      logs.push({
        id: `log-${Date.now()}-step-${i}`,
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Executing step ${i + 1}/${input.steps.length}: ${step.name}`,
        agent: 'edgepilot',
      });

      // In a real implementation, this would dispatch to the actual agent
      // For now, we simulate the step execution
      results[step.id] = {
        completed: true,
        output: `Simulated output for step: ${step.name}`,
      };
    }

    return {
      success: true,
      agentId: 'edgepilot',
      workflowId: run.id,
      summary: `Multi-step workflow completed successfully. Routed through ${input.steps.length} steps.`,
      output: {
        task,
        jobType,
        stepsCompleted: input.steps.length,
        results,
        routedTo: targetAgent.id,
      },
      logs,
      nextRecommendedAction: 'Review step outputs and proceed with next phase',
      timestamp: new Date().toISOString(),
    };
  }

  // Single task routing
  logs.push({
    id: `log-${Date.now()}-4`,
    timestamp: new Date().toISOString(),
    level: 'info',
    message: `Routing single task to ${targetAgent.displayName}`,
    agent: 'edgepilot',
  });

  // Simulate routing delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    success: true,
    agentId: 'edgepilot',
    workflowId: run.id,
    summary: `Successfully routed task "${task}" to ${targetAgent.displayName}`,
    output: {
      task,
      jobType,
      routedTo: targetAgent.id,
      routedToName: targetAgent.displayName,
      agentRole: targetAgent.role,
      capabilities: targetAgent.capabilities,
    },
    logs,
    nextRecommendedAction: `Monitor ${targetAgent.displayName} for completion and review output`,
    timestamp: new Date().toISOString(),
  };
}