'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Project, ProjectStatus } from '@/lib/types';
import { CheckCircle2, Circle, X } from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSave?: (project: Project) => void;
}

const statusOptions: ProjectStatus[] = ['Planning', 'Active', 'Paused', 'Completed'];

export function ProjectModal({ isOpen, onClose, project, onSave }: ProjectModalProps) {
  const [editedProject, setEditedProject] = useState<Project | null>(project);

  if (!project && !editedProject) return null;

  const currentProject = editedProject || project;
  if (!currentProject) return null;

  const completedMilestones = currentProject.milestones.filter(m => m.completed).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={project ? 'Project Details' : 'New Project'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          {onSave && (
            <Button onClick={() => onSave(currentProject)}>Save Changes</Button>
          )}
        </>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">{currentProject.name}</h2>
          <Badge variant={currentProject.status === 'Active' ? 'primary' : 'default'}>
            {currentProject.status}
          </Badge>
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium text-slate-400 mb-2 block">Description</label>
          <p className="text-slate-300">{currentProject.description}</p>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-400">Progress</label>
            <span className="text-slate-300 font-semibold">{currentProject.progress}%</span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              style={{ width: `${currentProject.progress}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-slate-100">{currentProject.linkedTaskCount}</div>
            <div className="text-sm text-slate-400">Linked Tasks</div>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-slate-100">{currentProject.linkedDocumentCount}</div>
            <div className="text-sm text-slate-400">Documents</div>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-slate-100">{completedMilestones}/{currentProject.milestones.length}</div>
            <div className="text-sm text-slate-400">Milestones</div>
          </div>
        </div>

        {/* Milestones */}
        <div>
          <label className="text-sm font-medium text-slate-400 mb-3 block">Milestones</label>
          <div className="space-y-2">
            {currentProject.milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg"
              >
                {milestone.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-600" />
                )}
                <span className={milestone.completed ? 'text-slate-400 line-through' : 'text-slate-200'}>
                  {milestone.title}
                </span>
                {milestone.dueDate && (
                  <span className="ml-auto text-xs text-slate-500">
                    Due {new Date(milestone.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Dates */}
        <div className="flex items-center justify-between text-sm text-slate-500 pt-4 border-t border-slate-800">
          <span>Created: {new Date(currentProject.createdAt).toLocaleDateString()}</span>
          <span>Last Updated: {new Date(currentProject.lastUpdated).toLocaleDateString()}</span>
        </div>
      </div>
    </Modal>
  );
}
