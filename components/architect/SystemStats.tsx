'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { FolderKanban, ListTodo, Users, Workflow } from 'lucide-react';

interface SystemStatsProps {
  activeProjects: number;
  tasksInProgress: number;
  agentsWorking: number;
  workflowsRunning: number;
}

const stats = [
  { key: 'activeProjects', label: 'Active Projects', icon: FolderKanban, color: 'text-indigo-400', bgColor: 'bg-indigo-500/20' },
  { key: 'tasksInProgress', label: 'Tasks In Progress', icon: ListTodo, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  { key: 'agentsWorking', label: 'Agents Working', icon: Users, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  { key: 'workflowsRunning', label: 'Workflows Running', icon: Workflow, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
];

export function SystemStats({ activeProjects, tasksInProgress, agentsWorking, workflowsRunning }: SystemStatsProps) {
  const values = { activeProjects, tasksInProgress, agentsWorking, workflowsRunning };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const value = values[stat.key as keyof typeof values];
        return (
          <Card key={stat.key} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-100">{value}</div>
                <div className="text-xs text-slate-500">{stat.label}</div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
