'use client';

import React, { useState, useMemo } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { FilterBar } from '@/components/tasks/FilterBar';
import { TaskModal } from '@/components/tasks/TaskModal';
import { Button } from '@/components/ui/Button';
import { Task, ColumnType } from '@/lib/types';
import { tasks as initialTasks } from '@/lib/data';
import { Plus } from 'lucide-react';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [defaultColumn, setDefaultColumn] = useState<ColumnType | undefined>();

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (selectedAgent && task.assignedAgent !== selectedAgent) {
        return false;
      }
      if (selectedProject && task.project !== selectedProject) {
        return false;
      }
      if (selectedPriority && task.priority !== selectedPriority) {
        return false;
      }
      return true;
    });
  }, [tasks, searchQuery, selectedAgent, selectedProject, selectedPriority]);

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    setDefaultColumn(undefined);
    setIsModalOpen(true);
  };

  const handleAddTask = (column?: ColumnType) => {
    setEditingTask(undefined);
    setDefaultColumn(column);
    setIsModalOpen(true);
  };

  const handleSaveTask = (task: Task) => {
    setTasks((prev) => {
      const exists = prev.find((t) => t.id === task.id);
      if (exists) {
        return prev.map((t) => (t.id === task.id ? task : t));
      }
      return [...prev, task];
    });
  };

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-64">
        <TopBar title="Task Board" />
        <main className="flex-1 overflow-hidden flex flex-col p-4 lg:p-8">
          <div className="max-w-[1600px] mx-auto w-full h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-semibold text-slate-100">Task Board</h1>
                <p className="text-slate-500 text-sm mt-1">
                  Manage and track tasks across all projects
                </p>
              </div>
              <Button onClick={() => handleAddTask()}>
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            </div>

            {/* Filters */}
            <div className="mb-4">
              <FilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedAgent={selectedAgent}
                onAgentChange={setSelectedAgent}
                selectedProject={selectedProject}
                onProjectChange={setSelectedProject}
                selectedPriority={selectedPriority}
                onPriorityChange={setSelectedPriority}
              />
            </div>

            {/* Kanban Board */}
            <div className="flex-1 min-h-0">
              <KanbanBoard
                tasks={filteredTasks}
                onTasksChange={setTasks}
                onTaskClick={handleTaskClick}
                onAddTask={handleAddTask}
              />
            </div>
          </div>
        </main>
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={editingTask}
        defaultColumn={defaultColumn}
        onSave={handleSaveTask}
      />
    </div>
  );
}
