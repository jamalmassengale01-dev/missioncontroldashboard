'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Workflow } from '@/lib/types';
import { Play, Pause, AlertCircle, CheckCircle2, Clock, RotateCcw } from 'lucide-react';

interface WorkflowCardProps {
  workflow: Workflow;
}

const statusConfig = {
  running: { icon: Play, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', badge: 'success' },
  paused: { icon: Pause, color: 'text-amber-400', bgColor: 'bg-amber-500/20', badge: 'warning' },
  error: { icon: AlertCircle, color: 'text-rose-400', bgColor: 'bg-rose-500/20', badge: 'danger' },
  idle: { icon: CheckCircle2, color: 'text-slate-400', bgColor: 'bg-slate-500/20', badge: 'default' },
} as const;

export function WorkflowCard({ workflow }: WorkflowCardProps) {
  const config = statusConfig[workflow.status];
  const Icon = config.icon;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100">{workflow.name}</h3>
            <Badge variant={config.badge as any} size="sm">
              {workflow.status}
            </Badge>
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-400 mb-4">{workflow.description}</p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-slate-500">
          <RotateCcw className="w-4 h-4" />
          <span>{workflow.runCount} runs</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <Clock className="w-4 h-4" />
          <span>Last: {new Date(workflow.lastRun).toLocaleTimeString()}</span>
        </div>
      </div>

      {workflow.nextRun && (
        <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-500">
          Next run: {new Date(workflow.nextRun).toLocaleString()}
        </div>
      )}
    </Card>
  );
}
