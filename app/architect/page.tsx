'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { FocusAreaCard } from '@/components/architect/FocusAreaCard';
import { PriorityQueue } from '@/components/architect/PriorityQueue';
import { DecisionQueue } from '@/components/architect/DecisionQueue';
import { SystemStats } from '@/components/architect/SystemStats';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { focusAreas, priorityQueue, decisionQueue, tasks, agents } from '@/lib/data';
import { getAllWorkflowDefinitions, WorkflowDefinition } from '@/lib/workflows/definitions';
import { workflowStore } from '@/lib/store/workflowStore';
import { executeWorkflow } from '@/lib/agents/executor';
import { WorkflowRun, Task, Agent } from '@/lib/types';
import { Crown, Plus, UserPlus, Play, ScrollText, Rocket, Loader2, CheckCircle, XCircle, Activity } from 'lucide-react';

export default function ArchitectPage() {
  const priorityRef = useRef<HTMLDivElement>(null);
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDefinition | null>(null);
  const [workflowInput, setWorkflowInput] = useState<Record<string, any>>({});
  const [recentRuns, setRecentRuns] = useState<WorkflowRun[]>([]);
  const [isLaunching, setIsLaunching] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Modal states
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isAssignAgentModalOpen, setIsAssignAgentModalOpen] = useState(false);
  const [isReviewPrioritiesModalOpen, setIsReviewPrioritiesModalOpen] = useState(false);
  
  // Task form state
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    assignedAgent: 'BuildForge',
    priority: 'Medium',
    status: 'Backlog',
  });
  
  // Assign agent form state
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [assignmentTask, setAssignmentTask] = useState<string>('');

  const activeProjects = 5;
  const tasksInProgress = tasks.filter(t => t.status === 'In Progress').length;

  useEffect(() => {
    setIsClient(true);
    loadWorkflows();
    loadRecentRuns();

    // Subscribe to store updates
    const unsubscribe = workflowStore.onAll(() => {
      loadRecentRuns();
    });

    return () => unsubscribe();
  }, []);

  const loadWorkflows = () => {
    const defs = getAllWorkflowDefinitions();
    setWorkflows(defs);
  };

  const loadRecentRuns = () => {
    const runs = workflowStore.listRuns().slice(0, 10);
    setRecentRuns(runs);
  };

  const scrollToPriorities = () => {
    priorityRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLaunchWorkflow = async () => {
    if (!selectedWorkflow) return;

    setIsLaunching(true);
    try {
      const run = workflowStore.createRun(selectedWorkflow, workflowInput, selectedWorkflow.defaultAgent);
      await executeWorkflow(run.id);
      
      // Reset form
      setSelectedWorkflow(null);
      setWorkflowInput({});
      loadRecentRuns();
    } catch (error) {
      console.error('Error launching workflow:', error);
    } finally {
      setIsLaunching(false);
    }
  };

  const handleWorkflowSelect = (workflow: WorkflowDefinition) => {
    setSelectedWorkflow(workflow);
    // Initialize input with defaults
    const defaultInput: Record<string, any> = {};
    if (workflow.inputSchema.properties) {
      Object.entries(workflow.inputSchema.properties).forEach(([key, value]: [string, any]) => {
        if (value.default) {
          defaultInput[key] = value.default;
        }
      });
    }
    setWorkflowInput(defaultInput);
  };

  const handleCreateTask = () => {
    setNewTask({
      title: '',
      description: '',
      assignedAgent: 'BuildForge',
      priority: 'Medium',
      status: 'Backlog',
    });
    setIsCreateTaskModalOpen(true);
  };

  const handleSaveTask = () => {
    // In a real app, this would save to a backend
    console.log('Creating task:', newTask);
    setIsCreateTaskModalOpen(false);
  };

  const handleAssignAgent = () => {
    setSelectedAgent(agents[0]?.id || '');
    setAssignmentTask('');
    setIsAssignAgentModalOpen(true);
  };

  const handleSaveAssignment = () => {
    console.log('Assigning agent:', selectedAgent, 'to task:', assignmentTask);
    setIsAssignAgentModalOpen(false);
  };

  const handleReviewPriorities = () => {
    setIsReviewPrioritiesModalOpen(true);
  };

  const renderInputField = (key: string, schema: any) => {
    const value = workflowInput[key] || '';
    
    return (
      <div key={key} className="mb-3">
        <label className="block text-sm text-slate-400 mb-1">
          {schema.title || key}
          {schema.required?.includes(key) && <span className="text-red-400 ml-1">*</span>}
        </label>
        {schema.type === 'string' && schema.enum ? (
          <select
            value={value}
            onChange={(e) => setWorkflowInput({ ...workflowInput, [key]: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            {schema.enum.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : schema.type === 'string' && schema.description?.includes('long') ? (
          <textarea
            value={value}
            onChange={(e) => setWorkflowInput({ ...workflowInput, [key]: e.target.value })}
            placeholder={schema.description}
            rows={3}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none resize-none"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => setWorkflowInput({ ...workflowInput, [key]: e.target.value })}
            placeholder={schema.description}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
          />
        )}
        {schema.description && (
          <p className="text-xs text-slate-600 mt-1">{schema.description}</p>
        )}
      </div>
    );
  };

  if (!isClient) {
    return (
      <div className="flex h-screen bg-slate-950">
        <Sidebar />
        <div className="flex-1 flex flex-col lg:ml-64">
          <TopBar title="Chief Architect" />
          <main className="flex-1 overflow-y-auto p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <p className="text-slate-500">Loading architect panel...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-64">
        <TopBar title="Chief Architect" />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-100">Chief Architect Command Center</h1>
                <p className="text-slate-500 text-sm">Strategic overview and control panel</p>
              </div>
            </div>

            {/* System Stats */}
            <SystemStats
              activeProjects={activeProjects}
              tasksInProgress={tasksInProgress}
              agentsWorking={recentRuns.filter(r => r.status === 'running').length}
              workflowsRunning={recentRuns.filter(r => ['running', 'queued'].includes(r.status)).length}
            />

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleCreateTask}>
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
              <Button variant="secondary" onClick={handleAssignAgent}>
                <UserPlus className="w-4 h-4 mr-2" />
                Assign Agent
              </Button>
              <Button variant="secondary" onClick={handleReviewPriorities}>
                <ScrollText className="w-4 h-4 mr-2" />
                Review Priorities
              </Button>
            </div>

            {/* Launch Workflow Section */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center gap-2">
                <Rocket className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-semibold text-slate-100">Launch Workflow</h2>
              </div>
              
              <div className="p-4">
                {!selectedWorkflow ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {workflows.map((workflow) => (
                      <button
                        key={workflow.id}
                        onClick={() => handleWorkflowSelect(workflow)}
                        className="text-left p-4 bg-slate-950 border border-slate-800 rounded-lg hover:border-indigo-500/50 hover:bg-slate-900 transition-all group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-slate-200 group-hover:text-indigo-300">
                            {workflow.name}
                          </h3>
                          <Badge variant="secondary" size="sm">
                            {workflow.defaultAgent}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {workflow.description}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-slate-200">{selectedWorkflow.name}</h3>
                        <p className="text-sm text-slate-500">{selectedWorkflow.description}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedWorkflow(null)}>
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                      {selectedWorkflow.inputSchema.properties && Object.entries(selectedWorkflow.inputSchema.properties).map(([key, value]) => 
                        renderInputField(key, value)
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleLaunchWorkflow}
                        disabled={isLaunching}
                      >
                        {isLaunching ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4 mr-2" />
                        )}
                        {isLaunching ? 'Launching...' : 'Launch Workflow'}
                      </Button>
                      <Button variant="secondary" onClick={() => setSelectedWorkflow(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Runs */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-semibold text-slate-100">Recent Workflow Runs</h2>
                </div>
                <Badge variant="secondary">{recentRuns.length} total</Badge>
              </div>
              
              <div className="divide-y divide-slate-800">
                {recentRuns.slice(0, 5).map((run) => (
                  <div key={run.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-3">
                      {run.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : run.status === 'failed' ? (
                        <XCircle className="w-5 h-5 text-red-400" />
                      ) : run.status === 'running' ? (
                        <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-700" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-200">{run.workflowName}</p>
                        <p className="text-xs text-slate-500">
                          {run.assignedAgent} • {new Date(run.startedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={
                        run.status === 'completed' ? 'success' :
                        run.status === 'failed' ? 'danger' :
                        run.status === 'running' ? 'warning' :
                        'default'
                      }
                      size="sm"
                    >
                      {run.status}
                    </Badge>
                  </div>
                ))}
              </div>
              
              {recentRuns.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-slate-500">No workflow runs yet</p>
                  <p className="text-sm text-slate-600 mt-1">Launch a workflow to get started</p>
                </div>
              )}
            </div>

            {/* Focus Areas */}
            <div>
              <h2 className="text-lg font-semibold text-slate-100 mb-4">Current Focus Areas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {focusAreas.map((area) => (
                  <FocusAreaCard key={area.id} area={area} />
                ))}
              </div>
            </div>

            {/* Priority Queue */}
            <div ref={priorityRef}>
              <h2 className="text-lg font-semibold text-slate-100 mb-4">Priority Queue</h2>
              <PriorityQueue items={priorityQueue} />
            </div>

            {/* Decision Queue */}
            <div>
              <h2 className="text-lg font-semibold text-slate-100 mb-4">Decision Queue</h2>
              <DecisionQueue items={decisionQueue} />
            </div>
          </div>
        </main>
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        title="Create New Task"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCreateTaskModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTask}>Create Task</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Title</label>
            <input
              type="text"
              value={newTask.title || ''}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
              placeholder="Enter task title..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Description</label>
            <textarea
              value={newTask.description || ''}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 resize-none"
              rows={3}
              placeholder="Enter task description..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Assigned Agent</label>
              <select
                value={newTask.assignedAgent}
                onChange={(e) => setNewTask({ ...newTask, assignedAgent: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
              >
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.name}>{agent.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Priority</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      {/* Assign Agent Modal */}
      <Modal
        isOpen={isAssignAgentModalOpen}
        onClose={() => setIsAssignAgentModalOpen(false)}
        title="Assign Agent to Task"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsAssignAgentModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAssignment}>Assign</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Select Agent</label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
            >
              {agents.filter(a => a.id !== 'chief-architect').map((agent) => (
                <option key={agent.id} value={agent.id}>{agent.name} - {agent.role}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Task Description</label>
            <textarea
              value={assignmentTask}
              onChange={(e) => setAssignmentTask(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 resize-none"
              rows={3}
              placeholder="Describe the task to assign..."
            />
          </div>
        </div>
      </Modal>

      {/* Review Priorities Modal */}
      <Modal
        isOpen={isReviewPrioritiesModalOpen}
        onClose={() => setIsReviewPrioritiesModalOpen(false)}
        title="Review Priority Queue"
        footer={
          <Button variant="secondary" onClick={() => setIsReviewPrioritiesModalOpen(false)}>Close</Button>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">Current priority rankings and their impact assessment:</p>
          <div className="space-y-3">
            {priorityQueue.map((item, index) => (
              <div key={item.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-200">#{index + 1} {item.title}</span>
                  <Badge variant={item.impact === 'High' ? 'danger' : item.impact === 'Medium' ? 'warning' : 'default'} size="sm">
                    {item.impact} Impact
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mb-2">{item.description}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>Effort: {item.estimatedEffort}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
