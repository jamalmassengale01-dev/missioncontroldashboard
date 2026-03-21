'use client';

import React, { useState } from 'react';
import { Task } from '@/lib/types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Draggable } from '@hello-pangea/dnd';
import { Calendar, MessageSquare, Play, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { workflowStore } from '@/lib/store/workflowStore';
import { getAllWorkflowDefinitions } from '@/lib/workflows/definitions';
import { executeWorkflow } from '@/lib/agents/executor';

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: () => void;
}

const priorityVariants: Record<Task['priority'], 'default' | 'primary' | 'warning' | 'danger'> = {
  Low: 'default',
  Medium: 'primary',
  High: 'warning',
  Critical: 'danger',
};

// Map task to appropriate workflow based on assigned agent
function getWorkflowForTask(task: Task): string | null {
  const agentWorkflowMap: Record<string, string> = {
    'DeepForge': 'research-viable-saas',
    'ScriptForge': 'create-youtube-script',
    'GrowthForge': 'go-to-market-plan',
    'BuildForge': 'plan-mvp-architecture',
    'SignalForge': 'create-social-hooks',
  };
  
  return agentWorkflowMap[task.assignedAgent] || null;
}

// Map task to agent ID
function getAgentIdForTask(task: Task): string {
  const agentMap: Record<string, string> = {
    'DeepForge': 'deepforge',
    'ScriptForge': 'scriptforge',
    'GrowthForge': 'growthforge',
    'BuildForge': 'buildforge',
    'SignalForge': 'signalforge',
    'EdgePilot': 'edgepilot',
  };
  
  return agentMap[task.assignedAgent] || 'edgepilot';
}

export function TaskCard({ task, index, onClick }: TaskCardProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastRunId, setLastRunId] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<string | null>(null);

  const handleExecute = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExecuting(true);

    try {
      const workflowId = getWorkflowForTask(task);
      const agentId = getAgentIdForTask(task);
      
      if (!workflowId) {
        // Create ad-hoc workflow for tasks without matching workflow
        const run = workflowStore.createRun(
          {
            id: `task-${task.id}`,
            name: task.title,
            description: task.description,
            defaultAgent: agentId,
            steps: [],
            inputSchema: {},
            outputSchema: {},
          },
          { task: task.title, description: task.description },
          agentId
        );
        
        setLastRunId(run.id);
        const response = await executeWorkflow(run.id);
        setRunStatus(response.success ? 'completed' : 'failed');
      } else {
        // Use predefined workflow
        const definitions = getAllWorkflowDefinitions();
        const definition = definitions.find(d => d.id === workflowId);
        
        if (definition) {
          const run = workflowStore.createRun(
            definition,
            { 
              topic: task.title,
              targetAudience: task.project,
              ...extractTaskInput(task)
            },
            agentId
          );
          
          setLastRunId(run.id);
          const response = await executeWorkflow(run.id);
          setRunStatus(response.success ? 'completed' : 'failed');
        }
      }
    } catch (error) {
      console.error('Error executing task:', error);
      setRunStatus('failed');
    } finally {
      setIsExecuting(false);
    }
  };

  // Extract relevant input from task based on assigned agent
  const extractTaskInput = (task: Task): Record<string, any> => {
    switch (task.assignedAgent) {
      case 'DeepForge':
        return { targetAudience: task.project, constraints: task.description };
      case 'ScriptForge':
        return { topic: task.title.replace(/script|write|create/gi, '').trim(), targetLength: '10 minutes' };
      case 'GrowthForge':
        return { productDescription: task.title, targetTraders: task.project };
      case 'BuildForge':
        return { requirements: task.description, techPreferences: 'modern web stack' };
      case 'SignalForge':
        return { brandVoice: 'Educational and authentic', platform: 'multi-platform', topic: task.project };
      default:
        return {};
    }
  };

  // Check for active runs
  React.useEffect(() => {
    if (lastRunId) {
      const run = workflowStore.getRun(lastRunId);
      if (run) {
        setRunStatus(run.status);
      }
    }
  }, [lastRunId]);

  const canExecute = ['DeepForge', 'ScriptForge', 'GrowthForge', 'BuildForge', 'SignalForge', 'EdgePilot'].includes(task.assignedAgent);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`mb-3 ${snapshot.isDragging ? 'opacity-90 rotate-2' : ''}`}
          style={provided.draggableProps.style}
        >
          <Card onClick={onClick} className="p-4 hover:border-indigo-500/30 transition-all group">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-sm font-medium text-slate-200 line-clamp-2 group-hover:text-indigo-300 transition-colors">
                {task.title}
              </h3>
              <Badge variant={priorityVariants[task.priority]} size="sm">
                {task.priority}
              </Badge>
            </div>
            
            <p className="text-xs text-slate-500 line-clamp-2 mb-3">
              {task.description}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar name={task.assignedAgent} size="sm" />
                <span className="text-xs text-slate-400">{task.assignedAgent}</span>
              </div>
              
              <div className="flex items-center gap-3 text-slate-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span className="text-xs">{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                {task.activityLog.length > 0 && (
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    <span className="text-xs">{task.activityLog.length}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
              <Badge variant="default" className="text-xs">
                {task.project}
              </Badge>
              
              {canExecute && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2"
                  onClick={handleExecute}
                  disabled={isExecuting}
                >
                  {isExecuting ? (
                    <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                  ) : runStatus === 'completed' ? (
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                  ) : runStatus === 'failed' ? (
                    <Play className="w-3 h-3 text-red-400" />
                  ) : runStatus === 'running' ? (
                    <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                  ) : (
                    <Play className="w-3 h-3 text-indigo-400" />
                  )}
                  <span className="ml-1 text-xs">
                    {isExecuting ? 'Running...' : 
                     runStatus === 'completed' ? 'Done' :
                     runStatus === 'failed' ? 'Retry' :
                     runStatus === 'running' ? 'Running' :
                     'Execute'}
                  </span>
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </Draggable>
  );
}