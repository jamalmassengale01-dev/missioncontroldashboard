import { NextRequest, NextResponse } from 'next/server';
import { workflowStore } from '@/lib/store/workflowStore';
import { getAllWorkflowDefinitions } from '@/lib/workflows/definitions';
import { executeWorkflow } from '@/lib/agents/executor';
import { requireAuth } from '@/lib/auth/local';
import { auditLogger } from '@/lib/audit';

// GET /api/workflows - List all workflow definitions and recent runs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const status = searchParams.get('status');
    const agent = searchParams.get('agent');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    
    // Get workflow definitions
    const definitions = getAllWorkflowDefinitions();
    
    // Get runs with filters
    const filters: any = {};
    if (status) filters.status = status;
    if (agent) filters.agent = agent;
    
    const runs = workflowStore.listRuns(filters).slice(0, limit);
    
    // Get stats
    const stats = workflowStore.getStats();

    return NextResponse.json({
      definitions,
      runs,
      stats,
    });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/workflows - Create and optionally execute a new workflow run
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await requireAuth(request);

    const body = await request.json();
    const { workflowId, input, agentId, execute = true } = body;

    if (!workflowId) {
      return NextResponse.json(
        { error: 'workflowId is required' },
        { status: 400 }
      );
    }

    // Import here to avoid circular dependency
    const { getWorkflowDefinition } = await import('@/lib/workflows/definitions');
    const definition = getWorkflowDefinition(workflowId);

    if (!definition) {
      return NextResponse.json(
        { error: `Workflow definition ${workflowId} not found` },
        { status: 404 }
      );
    }

    // Create workflow run
    const run = workflowStore.createRun(
      definition,
      input || {},
      agentId || definition.defaultAgent
    );

    // Log creation
    auditLogger.logWorkflowAction('workflow_created', run.id, session.username, {
      workflowDefinitionId: workflowId,
      agentId: agentId || definition.defaultAgent,
      input,
    }, {
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Execute if requested
    if (execute) {
      const response = await executeWorkflow(run.id);
      return NextResponse.json({
        runId: run.id,
        status: run.status,
        ...response,
      }, { status: 201 });
    }

    return NextResponse.json({
      runId: run.id,
      status: run.status,
      message: 'Workflow created and queued',
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
