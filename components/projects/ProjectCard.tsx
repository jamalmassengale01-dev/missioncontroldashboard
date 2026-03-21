'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Project } from '@/lib/types';
import { CheckCircle2, Circle, FileText, ListTodo } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

const statusVariants = {
  Planning: 'default',
  Active: 'primary',
  Paused: 'warning',
  Completed: 'success',
} as const;

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const completedMilestones = project.milestones.filter(m => m.completed).length;
  const totalMilestones = project.milestones.length;

  return (
    <Card onClick={onClick} className="p-5 hover:border-indigo-500/30 transition-all">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-slate-100">{project.name}</h3>
        <Badge variant={statusVariants[project.status] as any}>{project.status}</Badge>
      </div>

      <p className="text-sm text-slate-400 mb-4 line-clamp-2">{project.description}</p>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400">Progress</span>
          <span className="text-slate-300 font-medium">{project.progress}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1.5 text-slate-400">
          <ListTodo className="w-4 h-4" />
          <span>{project.linkedTaskCount} tasks</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <FileText className="w-4 h-4" />
          <span>{project.linkedDocumentCount} docs</span>
        </div>
      </div>

      {/* Milestones */}
      <div className="space-y-2">
        <div className="text-xs text-slate-500">
          Milestones ({completedMilestones}/{totalMilestones})
        </div>
        <div className="flex gap-1.5">
          {project.milestones.slice(0, 4).map((milestone) => (
            <div
              key={milestone.id}
              className="flex-1"
              title={milestone.title}
            >
              {milestone.completed ? (
                <div className="h-1.5 bg-emerald-500/60 rounded-full" />
              ) : (
                <div className="h-1.5 bg-slate-700 rounded-full" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-4 pt-3 border-t border-slate-800">
        <span className="text-xs text-slate-500">
          Updated {new Date(project.lastUpdated).toLocaleDateString()}
        </span>
      </div>
    </Card>
  );
}
