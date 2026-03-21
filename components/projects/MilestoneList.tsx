'use client';

import React from 'react';
import { Milestone } from '@/lib/types';
import { CheckCircle2, Circle } from 'lucide-react';

interface MilestoneListProps {
  milestones: Milestone[];
  compact?: boolean;
}

export function MilestoneList({ milestones, compact = false }: MilestoneListProps) {
  if (compact) {
    const completed = milestones.filter(m => m.completed).length;
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {milestones.slice(0, 4).map((m) => (
            <div
              key={m.id}
              className={`w-2 h-2 rounded-full ${m.completed ? 'bg-emerald-500' : 'bg-slate-700'}`}
            />
          ))}
        </div>
        <span className="text-xs text-slate-500">
          {completed}/{milestones.length}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {milestones.map((milestone) => (
        <div
          key={milestone.id}
          className="flex items-center gap-3 p-2 hover:bg-slate-800/30 rounded-lg transition-colors"
        >
          {milestone.completed ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <Circle className="w-5 h-5 text-slate-600 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className={milestone.completed ? 'text-slate-400 line-through' : 'text-slate-200'}>
              {milestone.title}
            </p>
          </div>
          {milestone.dueDate && (
            <span className="text-xs text-slate-500">
              {new Date(milestone.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
