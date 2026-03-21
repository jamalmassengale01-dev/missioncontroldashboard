import { NextRequest, NextResponse } from 'next/server';
import { workflowStore } from '@/lib/store/workflowStore';
import { updateAgentStatus } from '@/lib/agents/registry';

// GET /api/workflows/[id] - Get workflow run details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const run = workflowStore.getRun(id);

    if (!run) {
      return NextResponse.json(
        { error: `Workflow run ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ run });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/workflows/[id] - Update workflow status (cancel, retry, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    const run = workflowStore.getRun(id);
    if (!run) {
      return NextResponse.json(
        { error: `Workflow run ${id} not found` },
        { status: 404 }
      );
    }

    switch (action) {
      case 'cancel': {
        const canceled = workflowStore.cancelRun(id);
        if (!canceled) {
          return NextResponse.json(
            { error: 'Cannot cancel workflow in current state' },
            { status: 400 }
          );
        }
        // Update agent status
        updateAgentStatus(run.assignedAgent, 'idle');
        return NextResponse.json({ run: canceled, message: 'Workflow canceled' });
      }

      case 'retry': {
        if (run.status !== 'failed' && run.status !== 'blocked') {
          return NextResponse.json(
            { error: 'Can only retry failed or blocked workflows' },
            { status: 400 }
          );
        }

        // Reset status and increment retry count
        const updated = workflowStore.updateRun(id, {
          status: 'queued',
          retryCount: run.retryCount + 1,
          error: undefined,
        });

        // Re-import and execute
        const { executeWorkflow } = await import('@/lib/agents/executor');
        const response = await executeWorkflow(id);

        return NextResponse.json({
          run: workflowStore.getRun(id),
          retryResponse: response,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error updating workflow:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/workflows/[id] - Delete a workflow run
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const run = workflowStore.getRun(id);

    if (!run) {
      return NextResponse.json(
        { error: `Workflow run ${id} not found` },
        { status: 404 }
      );
    }

    // Don't allow deletion of running workflows
    if (run.status === 'running') {
      return NextResponse.json(
        { error: 'Cannot delete a running workflow. Cancel it first.' },
        { status: 400 }
      );
    }

    workflowStore.deleteRun(id);
    return NextResponse.json({ message: 'Workflow deleted' });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}