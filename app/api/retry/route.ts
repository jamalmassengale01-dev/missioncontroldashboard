import { NextRequest, NextResponse } from 'next/server';
import { retryWorkflow } from '@/lib/agents/executor';
import { requireAuth } from '@/lib/auth/local';
import { auditLogger } from '@/lib/audit';

// POST /api/retry - Retry a failed workflow
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await requireAuth(request);

    const body = await request.json();
    const { runId } = body;

    if (!runId) {
      return NextResponse.json(
        { error: 'runId is required' },
        { status: 400 }
      );
    }

    const result = await retryWorkflow(runId);

    // Log the retry
    auditLogger.logWorkflowAction('workflow_retried', runId, session.username, {
      success: result.success,
      summary: result.summary,
    }, {
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.summary, details: result.output },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      runId,
      status: 'retrying',
      message: result.summary,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error retrying workflow:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
