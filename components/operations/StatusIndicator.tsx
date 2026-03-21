'use client';

import React from 'react';
import { Database, Users, Plug, Heart } from 'lucide-react';

interface StatusIndicatorProps {
  database: 'connected' | 'disconnected';
  agentWorkers: 'online' | 'offline' | 'degraded';
  integrations: 'operational' | 'partial' | 'down';
  health: 'good' | 'fair' | 'poor';
}

interface StatusConfig {
  icon: React.ElementType;
  label: string;
  states: Record<string, { color: string; bgColor: string; text: string }>;
}

const statusConfig: Record<string, StatusConfig> = {
  database: {
    icon: Database,
    label: 'Database',
    states: {
      connected: { color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', text: 'Connected' },
      disconnected: { color: 'text-rose-400', bgColor: 'bg-rose-500/20', text: 'Disconnected' },
    },
  },
  agentWorkers: {
    icon: Users,
    label: 'Agent Workers',
    states: {
      online: { color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', text: 'Online' },
      offline: { color: 'text-rose-400', bgColor: 'bg-rose-500/20', text: 'Offline' },
      degraded: { color: 'text-amber-400', bgColor: 'bg-amber-500/20', text: 'Degraded' },
    },
  },
  integrations: {
    icon: Plug,
    label: 'Integrations',
    states: {
      operational: { color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', text: 'Operational' },
      partial: { color: 'text-amber-400', bgColor: 'bg-amber-500/20', text: 'Partial' },
      down: { color: 'text-rose-400', bgColor: 'bg-rose-500/20', text: 'Down' },
    },
  },
  health: {
    icon: Heart,
    label: 'System Health',
    states: {
      good: { color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', text: 'Good' },
      fair: { color: 'text-amber-400', bgColor: 'bg-amber-500/20', text: 'Fair' },
      poor: { color: 'text-rose-400', bgColor: 'bg-rose-500/20', text: 'Poor' },
    },
  },
};

export function StatusIndicator({ database, agentWorkers, integrations, health }: StatusIndicatorProps) {
  const statuses = [
    { key: 'database', value: database },
    { key: 'agentWorkers', value: agentWorkers },
    { key: 'integrations', value: integrations },
    { key: 'health', value: health },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statuses.map(({ key, value }) => {
        const config = statusConfig[key];
        const Icon = config.icon;
        const state = config.states[value];

        return (
          <div key={key} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
            <div className={`w-10 h-10 ${state.bgColor} rounded-lg flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${state.color}`} />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-200">{config.label}</div>
              <div className={`text-xs ${state.color}`}>{state.text}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
