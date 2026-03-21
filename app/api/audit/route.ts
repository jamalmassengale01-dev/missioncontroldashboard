import { NextRequest, NextResponse } from 'next/server';
import { auditStore } from '@/lib/audit/store';
import { requireAuth } from '@/lib/auth/local';

// GET /api/audit - Query audit events
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth(request);

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const actor = searchParams.get('actor') || undefined;
    const action = searchParams.get('action') || undefined;
    const resource = searchParams.get('resource') || undefined;
    const resourceId = searchParams.get('resourceId') || undefined;
    const startTime = searchParams.get('startTime') || undefined;
    const endTime = searchParams.get('endTime') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build query
    const query: any = { limit, offset };
    if (actor) query.actor = actor;
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (resourceId) query.resourceId = resourceId;
    if (startTime) query.startTime = startTime;
    if (endTime) query.endTime = endTime;

    const events = auditStore.query(query);
    const stats = auditStore.getStats();

    return NextResponse.json({
      events,
      stats,
      pagination: {
        limit,
        offset,
        total: stats.totalEvents,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error fetching audit events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/audit - Export audit log
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth(request);

    const body = await request.json();
    const { format = 'json', ...queryParams } = body;

    // Build query from params
    const query: any = {};
    if (queryParams.actor) query.actor = queryParams.actor;
    if (queryParams.action) query.action = queryParams.action;
    if (queryParams.resource) query.resource = queryParams.resource;
    if (queryParams.startTime) query.startTime = queryParams.startTime;
    if (queryParams.endTime) query.endTime = queryParams.endTime;

    if (format === 'csv') {
      const csv = auditStore.exportToCSV(query);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="audit-log.csv"',
        },
      });
    }

    // Default JSON export
    const json = auditStore.exportToJSON(query);
    return new NextResponse(json, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="audit-log.json"',
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error exporting audit log:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
