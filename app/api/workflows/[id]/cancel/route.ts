import { NextRequest, NextResponse } from 'next/server';
import { workflowStore } from '@/lib/store/workflowStore';
import { requireAuth } from '@/lib/auth/local';
import { auditLogger } from '@/lib/audit';

// POST /api/workflows/[id]/cancel - Cancel a workflow run
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const session = await requireAuth(request);
    const { id } = await params;

    const run = workflowStore.getRun(id);
    if (!run) {
      return NextResponse.json(
        { error: 'Workflow run not found' },
        { status: 404 }
      );
    }

    // Can only cancel queued, assigned, running, or waiting workflows
    if (!['queued', 'assigned', 'running', 'waiting'].includes(run.status)) {
      return NextResponse.json(
        { error: `Cannot cancel workflow with status: ${run.status}` },
        { status: 400 }
      );
    }

    const canceledRun = workflowStore.cancelRun(id);

    if (!canceledRun) {
      return NextResponse.json(
        { error: 'Failed to cancel workflow' },
        { status: 500 }
      );
    }

    // Log cancellation
    auditLogger.logWorkflowAction('workflow_canceled', id, session.username, {
      agentId: run.assignedAgent,
      previousStatus: run.status,
    }, {
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      runId: id,
      status: 'canceled',
      message: 'Workflow canceled successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error canceling workflow:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
