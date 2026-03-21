import { adapterRegistry } from '@/lib/adapters/registry';
import { AdapterHealth } from '@/lib/adapters/base';
import { getConfig } from './config';

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  adapters: Array<{
    id: string;
    name: string;
    enabled: boolean;
    health: AdapterHealth;
  }>;
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
    disabled: number;
  };
}

// Get health status for all registered adapters
export async function getSystemHealth(): Promise<SystemHealth> {
  const config = getConfig();
  const allHealth = await adapterRegistry.getAllHealth();
  const allAdapters = adapterRegistry.list();

  const adapters = allAdapters.map(adapter => {
    const health = allHealth.find(h => h.id === adapter.id)?.health || {
      status: 'unhealthy' as const,
      lastError: 'Health check not available',
      lastChecked: new Date(),
    };

    return {
      id: adapter.id,
      name: adapter.name,
      enabled: adapter.enabled,
      health,
    };
  });

  const summary = {
    total: adapters.length,
    healthy: adapters.filter(a => a.enabled && a.health.status === 'healthy').length,
    degraded: adapters.filter(a => a.enabled && a.health.status === 'degraded').length,
    unhealthy: adapters.filter(a => a.enabled && a.health.status === 'unhealthy').length,
    disabled: adapters.filter(a => !a.enabled).length,
  };

  // Determine overall status
  let status: SystemHealth['status'] = 'healthy';
  if (summary.unhealthy > 0) {
    status = 'unhealthy';
  } else if (summary.degraded > 0) {
    status = 'degraded';
  }

  return {
    status,
    timestamp: new Date(),
    adapters,
    summary,
  };
}

// Get health for a specific adapter
export async function getAdapterHealth(adapterId: string): Promise<AdapterHealth | null> {
  try {
    return await adapterRegistry.getHealth(adapterId);
  } catch {
    return null;
  }
}

// Quick health check (for load balancers)
export async function quickHealthCheck(): Promise<{ healthy: boolean; status: string }> {
  const health = await getSystemHealth();
  return {
    healthy: health.status !== 'unhealthy',
    status: health.status,
  };
}

// Format health for display
export function formatHealthStatus(health: SystemHealth): string {
  const lines = [
    `🩺 System Health: ${health.status.toUpperCase()}`,
    `📊 Adapters: ${health.summary.healthy} healthy, ${health.summary.degraded} degraded, ${health.summary.unhealthy} unhealthy, ${health.summary.disabled} disabled`,
    '',
    'Adapter Status:',
  ];

  for (const adapter of health.adapters) {
    const emoji = adapter.enabled
      ? adapter.health.status === 'healthy'
        ? '🟢'
        : adapter.health.status === 'degraded'
        ? '🟡'
        : '🔴'
      : '⚪';
    const latency = adapter.health.latency ? ` (${adapter.health.latency}ms)` : '';
    const error = adapter.health.lastError ? ` - ${adapter.health.lastError}` : '';
    lines.push(`${emoji} ${adapter.name}${latency}${error}`);
  }

  return lines.join('\n');
}
