import { NextRequest, NextResponse } from 'next/server';
import { approvalStore } from '@/lib/workflows/approval';
import { requireAuth } from '@/lib/auth/local';
import { auditLogger } from '@/lib/audit';

// GET /api/approvals - List approvals
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const session = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | undefined;
    const workflowRunId = searchParams.get('workflowRunId') || undefined;

    const approvals = approvalStore.list({ status, workflowRunId });
    const stats = approvalStore.getStats();

    return NextResponse.json({
      approvals,
      stats,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error fetching approvals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/approvals - Submit approval decision
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await requireAuth(request);

    const body = await request.json();
    const { approvalId, decision, comments, outputData } = body;

    if (!approvalId || !decision) {
      return NextResponse.json(
        { error: 'approvalId and decision are required' },
        { status: 400 }
      );
    }

    if (!['approved', 'rejected'].includes(decision)) {
      return NextResponse.json(
        { error: 'decision must be "approved" or "rejected"' },
        { status: 400 }
      );
    }

    const approval = approvalStore.getApproval(approvalId);
    if (!approval) {
      return NextResponse.json(
        { error: 'Approval not found' },
        { status: 404 }
      );
    }

    if (approval.status !== 'pending') {
      return NextResponse.json(
        { error: `Approval already ${approval.status}` },
        { status: 400 }
      );
    }

    let updatedApproval;
    if (decision === 'approved') {
      updatedApproval = approvalStore.approve(approvalId, session.username, comments, outputData);
    } else {
      updatedApproval = approvalStore.reject(approvalId, session.username, comments);
    }

    if (!updatedApproval) {
      return NextResponse.json(
        { error: 'Failed to update approval' },
        { status: 500 }
      );
    }

    // Log the decision
    auditLogger.logApprovalAction(
      'approval_decided',
      approvalId,
      approval.workflowRunId,
      session.username,
      {
        decision,
        comments,
        stepName: approval.stepName,
      },
      {
        ip: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      }
    );

    return NextResponse.json({
      success: true,
      approval: updatedApproval,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error processing approval:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
