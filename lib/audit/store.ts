import { AuditEvent, AuditQuery, AuditAction } from './types';

// In-memory audit event store
class AuditStore {
  private events: AuditEvent[] = [];
  private maxEvents: number = 10000; // Prevent unbounded growth

  // Add an audit event
  addEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
    const fullEvent: AuditEvent = {
      ...event,
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    this.events.push(fullEvent);

    // Trim old events if we exceed max
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    return fullEvent;
  }

  // Query audit events
  query(query: AuditQuery = {}): AuditEvent[] {
    let results = [...this.events];

    // Filter by actor
    if (query.actor) {
      results = results.filter(e => e.actor === query.actor);
    }

    // Filter by action
    if (query.action) {
      const actions = Array.isArray(query.action) ? query.action : [query.action];
      results = results.filter(e => actions.includes(e.action as AuditAction));
    }

    // Filter by resource
    if (query.resource) {
      results = results.filter(e => e.resource === query.resource);
    }

    // Filter by resourceId
    if (query.resourceId) {
      results = results.filter(e => e.resourceId === query.resourceId);
    }

    // Filter by time range
    if (query.startTime) {
      results = results.filter(e => e.timestamp >= query.startTime!);
    }
    if (query.endTime) {
      results = results.filter(e => e.timestamp <= query.endTime!);
    }

    // Sort by timestamp descending (newest first)
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;

    return results.slice(offset, offset + limit);
  }

  // Get events by resource ID
  getByResourceId(resourceId: string): AuditEvent[] {
    return this.events
      .filter(e => e.resourceId === resourceId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Get recent events
  getRecent(limit: number = 50): AuditEvent[] {
    return this.events
      .slice(-limit)
      .reverse();
  }

  // Get stats
  getStats(): {
    totalEvents: number;
    byAction: Record<string, number>;
    byActor: Record<string, number>;
    byResource: Record<string, number>;
  } {
    const byAction: Record<string, number> = {};
    const byActor: Record<string, number> = {};
    const byResource: Record<string, number> = {};

    this.events.forEach(event => {
      byAction[event.action] = (byAction[event.action] || 0) + 1;
      byActor[event.actor] = (byActor[event.actor] || 0) + 1;
      byResource[event.resource] = (byResource[event.resource] || 0) + 1;
    });

    return {
      totalEvents: this.events.length,
      byAction,
      byActor,
      byResource,
    };
  }

  // Export to JSON
  exportToJSON(query: AuditQuery = {}): string {
    const events = this.query(query);
    return JSON.stringify(events, null, 2);
  }

  // Export to CSV
  exportToCSV(query: AuditQuery = {}): string {
    const events = this.query(query);
    
    const headers = ['id', 'timestamp', 'actor', 'action', 'resource', 'resourceId', 'ip', 'details'];
    const rows = events.map(e => [
      e.id,
      e.timestamp,
      e.actor,
      e.action,
      e.resource,
      e.resourceId,
      e.ip || '',
      JSON.stringify(e.details),
    ]);

    return [headers.join(','), ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
  }

  // Clear all events (use with caution)
  clear(): void {
    this.events = [];
  }

  // Get count
  getCount(): number {
    return this.events.length;
  }
}

// Export singleton instance
export const auditStore = new AuditStore();
