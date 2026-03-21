'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FocusArea } from '@/lib/types';
import { Target } from 'lucide-react';

interface FocusAreaCardProps {
  area: FocusArea;
}

const priorityColors = {
  Critical: 'danger',
  High: 'warning',
  Medium: 'primary',
  Low: 'default',
} as const;

export function FocusAreaCard({ area }: FocusAreaCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
            <Target className="w-4 h-4 text-indigo-400" />
          </div>
          <h3 className="font-semibold text-slate-100">{area.title}</h3>
        </div>
        <Badge variant={priorityColors[area.priority] as any} size="sm">
          {area.priority}
        </Badge>
      </div>

      <p className="text-sm text-slate-400 mb-3 line-clamp-2">{area.description}</p>

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-500">Progress</span>
          <span className="text-slate-300">{area.progress}%</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
            style={{ width: `${area.progress}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
