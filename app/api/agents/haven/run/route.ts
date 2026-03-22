import { NextRequest, NextResponse } from 'next/server';
import { handleHaven } from '@/lib/agents/haven/handler';
import { workflowStore } from '@/lib/store/workflowStore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { runId } = body;
    
    if (!runId) {
      return NextResponse.json({ error: 'runId is required' }, { status: 400 });
    }
    
    const run = workflowStore.getRun(runId);
    if (!run) {
      return NextResponse.json({ error: 'Workflow run not found' }, { status: 404 });
    }
    
    const response = await handleHaven(run);
    
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
