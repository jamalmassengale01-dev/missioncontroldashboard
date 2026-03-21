'use client';

import React from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Task, ColumnType } from '@/lib/types';
import { KanbanColumn } from './KanbanColumn';

interface KanbanBoardProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  onTaskClick: (task: Task) => void;
  onAddTask: (column: ColumnType) => void;
}

const columns: ColumnType[] = ['Backlog', 'In Progress', 'Review', 'Done'];

export function KanbanBoard({ tasks, onTasksChange, onTaskClick, onAddTask }: KanbanBoardProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const newTasks = Array.from(tasks);
    const sourceColumn = source.droppableId as ColumnType;
    const destColumn = destination.droppableId as ColumnType;

    // Get tasks in source column
    const sourceTasks = newTasks.filter((t) => t.status === sourceColumn);
    const [movedTask] = sourceTasks.splice(source.index, 1);

    if (sourceColumn === destColumn) {
      // Reordering within same column
      sourceTasks.splice(destination.index, 0, movedTask);
    } else {
      // Moving to different column
      movedTask.status = destColumn;
      movedTask.activityLog.push({
        id: `a-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: `Moved from ${sourceColumn} to ${destColumn}`,
        agent: 'EdgePilot',
      });
    }

    onTasksChange(newTasks);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 h-full">
        {columns.map((column) => (
          <KanbanColumn
            key={column}
            column={column}
            tasks={tasks.filter((t) => t.status === column)}
            onTaskClick={onTaskClick}
            onAddTask={onAddTask}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
