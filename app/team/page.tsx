'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { AgentCard } from '@/components/team/AgentCard';
import { MissionStatement } from '@/components/team/MissionStatement';
import { TaskModal } from '@/components/tasks/TaskModal';
import { getAllAgents, AgentConfig } from '@/lib/agents/registry';
import { workflowStore } from '@/lib/store/workflowStore';
import { WorkflowRun, Task } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { RefreshCw } from 'lucide-react';

export default function TeamPage() {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [agentRuns, setAgentRuns] = useState<Record<string, WorkflowRun[]>>({});
  const [isClient, setIsClient] = useState(false);
  const [showActivityFor, setShowActivityFor] = useState<string | null>(null);

  // Task modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedAgentForTask, setSelectedAgentForTask] = useState<string>('');

  useEffect(() => {
    setIsClient(true);
    loadAgents();

    // Subscribe to store updates
    const unsubscribe = workflowStore.onAll(() => {
      loadAgentRuns();
    });

    return () => unsubscribe();
  }, []);

  const loadAgents = () => {
    const allAgents = getAllAgents();
    setAgents(allAgents);
    loadAgentRuns();
  };

  const loadAgentRuns = () => {
    const allAgents = getAllAgents();
    const runs: Record<string, WorkflowRun[]> = {};
    allAgents.forEach(agent => {
      runs[agent.id] = workflowStore.listRuns({ agent: agent.id }).slice(0, 5);
    });
    setAgentRuns(runs);
  };

  const handleAssignTask = (agentId: string) => {
    setSelectedAgentForTask(agentId);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (task: Task) => {
    console.log('Task created:', task);
    setIsTaskModalOpen(false);
  };

  const getAgentStatus = (agent: AgentConfig) => {
    const runs = agentRuns[agent.id] || [];
    const activeRun = runs.find(r => ['running', 'queued', 'assigned'].includes(r.status));

    if (activeRun) {
      return { status: activeRun.status, runId: activeRun.id };
    }

    const lastRun = runs[0];
    if (lastRun) {
      return { status: lastRun.status, runId: lastRun.id, isLast: true };
    }

    return { status: agent.status, runId: null };
  };

  if (!isClient) {
    return (
      <div className="flex h-screen bg-slate-950">
        <Sidebar />
        <div className="flex-1 flex flex-col lg:ml-64">
          <TopBar title="Team" />
          <main className="flex-1 overflow-y-auto p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <p className="text-slate-500">Loading team...</p>
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
        <TopBar title="Team" />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Mission Statement */}
            <MissionStatement />

            {/* Team Grid */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-100">Active Agents</h2>
                <Button variant="secondary" size="sm" onClick={loadAgents}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {agents.map((agent) => {
                  const agentStatus = getAgentStatus(agent);
                  const runs = agentRuns[agent.id] || [];
                  const isShowingActivity = showActivityFor === agent.id;

                  return (
                    <div key={agent.id} className="flex flex-col gap-2">
                      <AgentCard
                        agent={{
                          id: agent.id,
                          name: agent.displayName,
                          role: agent.role,
                          status: agentStatus.status as any,
                          currentFocus: agentStatus.runId
                            ? `Working on: ${runs.find(r => r.id === agentStatus.runId)?.workflowName || 'Task'}`
                            : 'Available for assignments',
                          lastActivity: agentStatus.runId
                            ? new Date(runs.find(r => r.id === agentStatus.runId)?.startedAt || '').toLocaleTimeString()
                            : 'No recent runs',
                          capabilities: agent.capabilities,
                        }}
                        onAssignTask={() => handleAssignTask(agent.id)}
                        onViewActivity={() => setShowActivityFor(isShowingActivity ? null : agent.id)}
                        isShowingActivity={isShowingActivity}
                      />

                      {/* Inline Activity Panel */}
                      {isShowingActivity && (
                        <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800">
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Recent Runs</p>
                          {runs.length === 0 ? (
                            <p className="text-xs text-slate-600">No runs yet for this agent.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {runs.map(run => (
                                <div key={run.id} className="flex items-center justify-between text-xs">
                                  <span className="text-slate-400 truncate max-w-[200px]">{run.workflowName}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                    run.status === 'completed' ? 'bg-emerald-900/50 text-emerald-400' :
                                    run.status === 'failed' ? 'bg-red-900/50 text-red-400' :
                                    run.status === 'running' ? 'bg-amber-900/50 text-amber-400' :
                                    'bg-slate-800 text-slate-400'
                                  }`}>
                                    {run.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Task Modal for Assigning Tasks */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        defaultAgent={selectedAgentForTask}
      />
    </div>
  );
}
