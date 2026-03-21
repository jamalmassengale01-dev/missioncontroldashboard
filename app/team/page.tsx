'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { AgentCard } from '@/components/team/AgentCard';
import { MissionStatement } from '@/components/team/MissionStatement';
import { getAllAgents, AgentConfig } from '@/lib/agents/registry';
import { workflowStore } from '@/lib/store/workflowStore';
import { getWorkflowsByAgent } from '@/lib/workflows/definitions';
import { executeWorkflow } from '@/lib/agents/executor';
import { WorkflowRun } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { 
  Play, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Activity,
  RefreshCw
} from 'lucide-react';

export default function TeamPage() {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [agentRuns, setAgentRuns] = useState<Record<string, WorkflowRun[]>>({});
  const [executingAgent, setExecutingAgent] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

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
    const runs: Record<string, WorkflowRun[]> = {};
    agents.forEach(agent => {
      runs[agent.id] = workflowStore.listRuns({ agent: agent.id }).slice(0, 5);
    });
    setAgentRuns(runs);
  };

  const handleQuickAction = async (agentId: string) => {
    setExecutingAgent(agentId);

    try {
      // Get available workflows for this agent
      const workflows = getWorkflowsByAgent(agentId);
      
      if (workflows.length > 0) {
        // Execute the first available workflow with default input
        const workflow = workflows[0];
        const defaultInput: Record<string, any> = {};
        
        // Generate sample input based on workflow
        if (workflow.id === 'research-viable-saas') {
          defaultInput.targetAudience = 'retail traders';
          defaultInput.constraints = 'automation focus';
        } else if (workflow.id === 'create-youtube-script') {
          defaultInput.topic = 'trading psychology';
          defaultInput.targetLength = '10 minutes';
        } else if (workflow.id === 'go-to-market-plan') {
          defaultInput.productDescription = 'Trading indicator tool';
          defaultInput.targetTraders = 'technical traders';
        } else if (workflow.id === 'plan-mvp-architecture') {
          defaultInput.requirements = 'Trading journal application';
          defaultInput.techPreferences = 'React, Node.js';
        } else if (workflow.id === 'create-social-hooks') {
          defaultInput.brandVoice = 'Educational and authentic';
          defaultInput.platform = 'TikTok';
        }

        const run = workflowStore.createRun(workflow, defaultInput, agentId);
        await executeWorkflow(run.id);
      } else {
        // Create ad-hoc workflow
        const run = workflowStore.createRun(
          {
            id: `adhoc-${Date.now()}`,
            name: `${agentId} Quick Task`,
            description: `Quick action triggered for ${agentId}`,
            defaultAgent: agentId,
            steps: [],
            inputSchema: {},
            outputSchema: {},
          },
          { action: 'quick_demo', timestamp: new Date().toISOString() },
          agentId
        );
        await executeWorkflow(run.id);
      }
    } catch (error) {
      console.error('Error executing quick action:', error);
    } finally {
      setExecutingAgent(null);
      loadAgentRuns();
    }
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
                  const isExecuting = executingAgent === agent.id;
                  
                  return (
                    <div key={agent.id} className="relative">
                      <AgentCard agent={{
                        id: agent.id,
                        name: agent.displayName,
                        role: agent.role,
                        status: agentStatus.status as any,
                        currentFocus: agentStatus.runId 
                          ? `Working on: ${agentRuns[agent.id]?.find(r => r.id === agentStatus.runId)?.workflowName || 'Task'}`
                          : 'Available for assignments',
                        lastActivity: agentStatus.runId
                          ? new Date(agentRuns[agent.id]?.find(r => r.id === agentStatus.runId)?.startedAt || '').toLocaleTimeString()
                          : 'Idle',
                        capabilities: agent.capabilities,
                      }} />
                      
                      {/* Quick Action Button */}
                      <div className="absolute top-4 right-4">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleQuickAction(agent.id)}
                          disabled={isExecuting}
                        >
                          {isExecuting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : agentStatus.status === 'running' ? (
                            <Activity className="w-4 h-4 text-amber-400" />
                          ) : agentStatus.status === 'completed' && agentStatus.isLast ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          ) : agentStatus.status === 'failed' ? (
                            <AlertCircle className="w-4 h-4 text-red-400" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                          <span className="ml-2">
                            {isExecuting ? 'Running...' :
                             agentStatus.status === 'running' ? 'Running' :
                             agentStatus.status === 'completed' && agentStatus.isLast ? 'Done' :
                             agentStatus.status === 'failed' ? 'Failed' :
                             'Demo Run'}
                          </span>
                        </Button>
                      </div>

                      {/* Recent Runs Mini-List */}
                      {agentRuns[agent.id] && agentRuns[agent.id].length > 0 && (
                        <div className="mt-2 mx-5 mb-4 bg-slate-950/50 rounded-lg p-3 border border-slate-800">
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Recent Runs</p>
                          <div className="space-y-1">
                            {agentRuns[agent.id].slice(0, 3).map(run => (
                              <div key={run.id} className="flex items-center justify-between text-xs">
                                <span className="text-slate-400 truncate max-w-[150px]">{run.workflowName}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] ${
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
    </div>
  );
}