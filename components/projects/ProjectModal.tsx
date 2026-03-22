'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Project, ProjectStatus } from '@/lib/types';
import { CheckCircle2, Circle, Trash2 } from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSave?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
}

const statusOptions: ProjectStatus[] = ['Planning', 'Active', 'Paused', 'Completed'];

export function ProjectModal({ isOpen, onClose, project, onSave, onDelete }: ProjectModalProps) {
  const [editedProject, setEditedProject] = useState<Project | null>(project);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setEditedProject(project);
    setIsEditing(false);
  }, [project, isOpen]);

  if (!project && !editedProject) return null;

  const currentProject = editedProject || project;
  if (!currentProject) return null;

  const completedMilestones = currentProject.milestones.filter(m => m.completed).length;

  const handleSave = () => {
    if (onSave && editedProject) {
      onSave(editedProject);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (onDelete && currentProject) {
      onDelete(currentProject.id);
      onClose();
    }
  };

  const toggleMilestone = (milestoneId: string) => {
    if (!editedProject) return;
    setEditedProject({
      ...editedProject,
      milestones: editedProject.milestones.map(m =>
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      ),
      progress: Math.round(
        (editedProject.milestones.filter(m => 
          m.id === milestoneId ? !m.completed : m.completed
        ).length / editedProject.milestones.length) * 100
      ),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Project' : 'Project Details'}
      size="lg"
      footer={
        <>
          {onDelete && (
            <Button variant="danger" onClick={handleDelete} className="mr-auto">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>Close</Button>
          {onSave && (
            isEditing ? (
              <Button onClick={handleSave}>Save Changes</Button>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Edit</Button>
            )
          )}
        </>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          {isEditing ? (
            <input
              type="text"
              value={editedProject?.name || ''}
              onChange={(e) => setEditedProject(prev => prev ? { ...prev, name: e.target.value } : null)}
              className="w-full text-2xl font-bold text-slate-100 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500/50"
            />
          ) : (
            <h2 className="text-2xl font-bold text-slate-100 mb-2">{currentProject.name}</h2>
          )}
          {isEditing ? (
            <select
              value={editedProject?.status}
              onChange={(e) => setEditedProject(prev => prev ? { ...prev, status: e.target.value as ProjectStatus } : null)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500/50"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          ) : (
            <Badge variant={currentProject.status === 'Active' ? 'primary' : 'default'}>
              {currentProject.status}
            </Badge>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium text-slate-400 mb-2 block">Description</label>
          {isEditing ? (
            <textarea
              value={editedProject?.description || ''}
              onChange={(e) => setEditedProject(prev => prev ? { ...prev, description: e.target.value } : null)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500/50 resize-none"
              rows={3}
            />
          ) : (
            <p className="text-slate-300">{currentProject.description}</p>
          )}
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
                onClick={() => isEditing && toggleMilestone(milestone.id)}
                className={`flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg ${isEditing ? 'cursor-pointer hover:bg-slate-800/50' : ''}`}
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
