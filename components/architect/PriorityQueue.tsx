'use client';

import React from 'react';
import { PriorityItem } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { ArrowUp, Clock, Zap } from 'lucide-react';

interface PriorityQueueProps {
  items: PriorityItem[];
}

const impactColors = {
  High: 'warning',
  Medium: 'primary',
  Low: 'default',
} as const;

export function PriorityQueue({ items }: PriorityQueueProps) {
  const sortedItems = [...items].sort((a, b) => a.rank - b.rank);

  return (
    <div className="space-y-3">
      {sortedItems.map((item, index) => (
        <div
          key={item.id}
          className="flex items-start gap-4 p-4 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors"
        >
          {/* Rank */}
          <div className="flex-shrink-0 w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-indigo-400">#{item.rank}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="font-medium text-slate-200">{item.title}</h4>
              <Badge variant={impactColors[item.impact] as any} size="sm">
                {item.impact} Impact
              </Badge>
            </div>
            <p className="text-sm text-slate-400 mb-2">{item.description}</p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{item.estimatedEffort}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
