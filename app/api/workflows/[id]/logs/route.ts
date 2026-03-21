import { NextRequest, NextResponse } from 'next/server';
import { workflowStore } from '@/lib/store/workflowStore';

// GET /api/workflows/[id]/logs - Get logs for a workflow run
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

    // Parse query params for filtering
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let logs = run.logs;

    // Filter by level if specified
    if (level) {
      logs = logs.filter(log => log.level === level);
    }

    // Apply pagination
    const total = logs.length;
    logs = logs.slice(offset, offset + limit);

    return NextResponse.json({
      logs,
      pagination: {
        total,
        offset,
        limit,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching workflow logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/workflows/[id]/logs - Add a log entry to a workflow run
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { level, message, agent, metadata } = body;

    if (!level || !message) {
      return NextResponse.json(
        { error: 'level and message are required' },
        { status: 400 }
      );
    }

    const run = workflowStore.getRun(id);
    if (!run) {
      return NextResponse.json(
        { error: `Workflow run ${id} not found` },
        { status: 404 }
      );
    }

    const log = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      level,
      message,
      agent,
      metadata,
    };

    workflowStore.addLog(id, log);

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    console.error('Error adding workflow log:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}