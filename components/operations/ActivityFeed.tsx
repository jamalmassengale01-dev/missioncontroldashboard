'use client';

import React from 'react';
import { ActivityItem } from '@/lib/types';
import { CheckCircle2, User, Workflow, Settings, FolderKanban, ListTodo } from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivityItem[];
}

const typeConfig = {
  task: { icon: ListTodo, color: 'text-indigo-400', bgColor: 'bg-indigo-500/20' },
  agent: { icon: User, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  workflow: { icon: Workflow, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  system: { icon: Settings, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  project: { icon: FolderKanban, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const config = typeConfig[activity.type];
        const Icon = config.icon;

        return (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg"
          >
            <div className={`w-8 h-8 ${config.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-4 h-4 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-300">{activity.description}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                <span>{new Date(activity.timestamp).toLocaleString()}</span>
                {activity.agent && (
                  <>
                    <span>•</span>
                    <span>{activity.agent}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
