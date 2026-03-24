'use client';

import React from 'react';
import { Task, ColumnType } from '@/lib/types';
import { TaskCard } from './TaskCard';
import { Droppable } from '@hello-pangea/dnd';
import { Badge } from '../ui/Badge';
import { Plus } from 'lucide-react';

interface ColumnProps {
  column: ColumnType;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (column: ColumnType) => void;
  onDeleteTask: (taskId: string) => void;
}

const columnColors: Record<ColumnType, string> = {
  'Backlog': 'border-slate-700',
  'In Progress': 'border-indigo-500/50',
  'Review': 'border-amber-500/50',
  'Done': 'border-emerald-500/50',
};

const columnBadgeVariants: Record<ColumnType, 'default' | 'primary' | 'warning' | 'success'> = {
  'Backlog': 'default',
  'In Progress': 'primary',
  'Review': 'warning',
  'Done': 'success',
};

export function KanbanColumn({ column, tasks, onTaskClick, onAddTask, onDeleteTask }: ColumnProps) {
  return (
    <div className="flex flex-col h-full min-w-[300px] w-full overflow-hidden">
      <div className={`flex items-center justify-between p-3 bg-slate-900/80 border-t-2 ${columnColors[column]} rounded-t-lg flex-shrink-0`}>
        <div className="flex items-center gap-2">
          <Badge variant={columnBadgeVariants[column]}>{column}</Badge>
          <span className="text-sm text-slate-500">{tasks.length}</span>
        </div>
        <button
          onClick={() => onAddTask(column)}
          className="p-1 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <Droppable droppableId={column}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-3 bg-slate-950/50 border border-slate-800 border-t-0 rounded-b-lg overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent ${
              snapshot.isDraggingOver ? 'bg-indigo-500/5 border-indigo-500/20' : ''
            }`}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-col items-center justify-center py-10 text-slate-600 select-none">
                <p className="text-sm">No tasks here</p>
                <button
                  onClick={() => onAddTask(column)}
                  className="mt-2 text-xs text-indigo-500 hover:text-indigo-400 transition-colors"
                >
                  + Add one
                </button>
              </div>
            )}
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onClick={() => onTaskClick(task)}
                onDelete={() => onDeleteTask(task.id)}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
