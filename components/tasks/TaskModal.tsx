'use client';

import React, { useState, useEffect } from 'react';
import { Task, ColumnType } from '@/lib/types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { agents, projects } from '@/lib/data';
import { Calendar, Clock, User, Tag, AlertCircle, MessageSquare, Trash2 } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task;
  defaultColumn?: ColumnType;
  defaultAgent?: string;
  onSave: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

const priorities: Task['priority'][] = ['Low', 'Medium', 'High', 'Critical'];
const agentNames = agents.map((a) => a.name);

export function TaskModal({ isOpen, onClose, task, defaultColumn, defaultAgent, onSave, onDelete }: TaskModalProps) {
  const isEditing = !!task;
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    assignedAgent: agentNames[0],
    priority: 'Medium',
    dueDate: new Date().toISOString().split('T')[0],
    project: projects[0],
    status: defaultColumn || 'Backlog',
    activityLog: [],
  });

  useEffect(() => {
    if (task) {
      setFormData(task);
    } else {
      setFormData({
        title: '',
        description: '',
        assignedAgent: defaultAgent ? agents.find(a => a.id === defaultAgent)?.name || agentNames[0] : agentNames[0],
        priority: 'Medium',
        dueDate: new Date().toISOString().split('T')[0],
        project: projects[0],
        status: defaultColumn || 'Backlog',
        activityLog: [],
      });
    }
  }, [task, defaultColumn, defaultAgent, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    const newTask: Task = {
      id: task?.id || `task-${Date.now()}`,
      title: formData.title || '',
      description: formData.description || '',
      assignedAgent: formData.assignedAgent || agentNames[0],
      priority: formData.priority || 'Medium',
      dueDate: formData.dueDate || new Date().toISOString().split('T')[0],
      project: formData.project || projects[0],
      status: (formData.status as ColumnType) || 'Backlog',
      activityLog: task?.activityLog || [
        {
          id: `a-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'Task created',
          agent: 'EdgePilot',
        },
      ],
    };

    onSave(newTask);
    onClose();
  };

  const handleDelete = () => {
    if (task && onDelete) {
      onDelete(task.id);
      onClose();
    }
  };

  const priorityVariants: Record<Task['priority'], 'default' | 'primary' | 'warning' | 'danger'> = {
    Low: 'default',
    Medium: 'primary',
    High: 'warning',
    Critical: 'danger',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Task' : 'Create New Task'}
      size="md"
      footer={
        <>
          {isEditing && onDelete && (
            <Button variant="danger" onClick={handleDelete} className="mr-auto">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {isEditing ? 'Save Changes' : 'Create Task'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Title</label>
          <input
            type="text"
            value={formData.title || ''}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
            placeholder="Enter task title..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Description</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 resize-none"
            rows={3}
            placeholder="Enter task description..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Assigned Agent</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <select
                value={formData.assignedAgent}
                onChange={(e) => setFormData({ ...formData, assignedAgent: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 appearance-none"
              >
                {agentNames.map((agent) => (
                  <option key={agent} value={agent}>
                    {agent}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Priority</label>
            <div className="flex gap-2">
              {priorities.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: p })}
                  className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium border transition-all ${
                    formData.priority === p
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                      : 'border-slate-800 bg-slate-950 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Due Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Project</label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <select
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 appearance-none"
              >
                {projects.map((project) => (
                  <option key={project} value={project}>
                    {project}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {isEditing && task && task.activityLog.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Activity Log</label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {task.activityLog.map((entry) => (
                <div key={entry.id} className="flex items-start gap-2 text-sm">
                  <Clock className="w-3 h-3 text-slate-600 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-slate-300">{entry.action}</span>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{entry.agent}</span>
                      <span>•</span>
                      <span>{new Date(entry.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
