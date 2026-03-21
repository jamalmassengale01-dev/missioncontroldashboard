import { NextRequest, NextResponse } from 'next/server';
import { executeWorkflow } from '@/lib/agents/executor';
import { workflowStore } from '@/lib/store/workflowStore';
import { getWorkflowDefinition } from '@/lib/workflows/definitions';
import { getAgentById } from '@/lib/agents/registry';

// POST /api/agents/[agentId]/run - Execute a workflow with an agent
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const body = await request.json();

    // Validate agent exists
    const agent = getAgentById(agentId);
    if (!agent) {
      return NextResponse.json(
        { error: `Agent ${agentId} not found` },
        { status: 404 }
      );
    }

    // Check if this is a workflow definition execution or direct execution
    const { workflowId, input, execute = true } = body;

    let run;
    
    if (workflowId) {
      // Execute a predefined workflow
      const definition = getWorkflowDefinition(workflowId);
      if (!definition) {
        return NextResponse.json(
          { error: `Workflow definition ${workflowId} not found` },
          { status: 404 }
        );
      }

      // Create workflow run
      run = workflowStore.createRun(definition, input || {}, agentId);
    } else {
      // Create ad-hoc workflow run
      const jobType = body.jobType || 'orchestrate';
      run = workflowStore.createRun(
        {
          id: `adhoc-${Date.now()}`,
          name: body.name || `Direct ${agent.displayName} Task`,
          description: body.description || `Direct execution by ${agent.displayName}`,
          defaultAgent: agentId,
          steps: [],
          inputSchema: {},
          outputSchema: {},
        },
        input || {},
        agentId
      );
    }

    // Execute if requested
    if (execute) {
      const response = await executeWorkflow(run.id);
      return NextResponse.json({
        runId: run.id,
        status: run.status,
        ...response,
      });
    }

    // Return queued workflow
    return NextResponse.json({
      runId: run.id,
      status: run.status,
      message: 'Workflow queued for execution',
    });
  } catch (error) {
    console.error('Error executing agent:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}