'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { WorkflowRun, WorkflowRunStatus } from '@/lib/types';
import { workflowStore } from '@/lib/store/workflowStore';
import { seedWorkflowData } from '@/lib/store/seedData';
import { 
  Settings, 
  Activity, 
  Zap, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock,
  RotateCcw,
  Trash2,
  ChevronUp,
  Terminal,
  Server,
  Plug,
  Shield,
  AlertTriangle,
  Loader2,
  FileText,
  Ban
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

const statusConfig: Record<WorkflowRunStatus, { color: string; label: string }> = {
  queued: { color: 'bg-slate-500', label: 'Queued' },
  assigned: { color: 'bg-blue-500', label: 'Assigned' },
  running: { color: 'bg-amber-500', label: 'Running' },
  waiting: { color: 'bg-purple-500', label: 'Waiting' },
  completed: { color: 'bg-emerald-500', label: 'Completed' },
  failed: { color: 'bg-red-500', label: 'Failed' },
  blocked: { color: 'bg-rose-500', label: 'Blocked' },
  canceled: { color: 'bg-slate-600', label: 'Canceled' },
};

export default function OperationsPage() {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);
  const [filter, setFilter] = useState<WorkflowRunStatus | 'all'>('all');
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, failed: 0 });
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<'workflows' | 'integrations'>('workflows');
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [logsRun, setLogsRun] = useState<WorkflowRun | null>(null);

  useEffect(() => {
    setIsClient(true);
    seedWorkflowData();
    loadRuns();

    const unsubscribe = workflowStore.onAll(() => {
      loadRuns();
    });

    return () => unsubscribe();
  }, []);

  const loadRuns = () => {
    const allRuns = workflowStore.listRuns();
    setRuns(allRuns);
    
    const storeStats = workflowStore.getStats();
    setStats({
      total: storeStats.total,
      active: storeStats.byStatus.running + storeStats.byStatus.queued + storeStats.byStatus.assigned,
      completed: storeStats.byStatus.completed,
      failed: storeStats.byStatus.failed + storeStats.byStatus.blocked,
    });
  };

  const filteredRuns = filter === 'all' ? runs : runs.filter(r => r.status === filter);

  const handleCancel = (runId: string) => {
    workflowStore.cancelRun(runId);
    loadRuns();
  };

  const handleRetry = async (runId: string) => {
    const { executeWorkflow } = await import('@/lib/agents/executor');
    await executeWorkflow(runId);
    loadRuns();
  };

  const handleDelete = (runId: string) => {
    workflowStore.deleteRun(runId);
    if (selectedRun?.id === runId) {
      setSelectedRun(null);
    }
    loadRuns();
  };

  const handleViewLogs = (run: WorkflowRun) => {
    setLogsRun(run);
    setIsLogsModalOpen(true);
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleString();
  };

  const formatDuration = (start: string, end?: string) => {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const duration = (endTime - startTime) / 1000;
    
    if (duration < 60) return `${duration.toFixed(0)}s`;
    if (duration < 3600) return `${(duration / 60).toFixed(1)}m`;
    return `${(duration / 3600).toFixed(1)}h`;
  };

  if (!isClient) {
    return (
      <div className="flex h-screen bg-slate-950">
        <Sidebar />
        <div className="flex-1 flex flex-col lg:ml-64">
          <TopBar title="Operations" />
          <main className="flex-1 overflow-y-auto p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <p className="text-slate-500">Loading operations panel...</p>
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
        <TopBar title="Operations" />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Settings className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-100">Operations Panel</h1>
                <p className="text-slate-500 text-sm">Workflow orchestration and monitoring</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <p className="text-slate-500 text-sm">Total Workflows</p>
                <p className="text-2xl font-semibold text-slate-100">{stats.total}</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <p className="text-slate-500 text-sm">Active</p>
                <p className="text-2xl font-semibold text-amber-400">{stats.active}</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <p className="text-slate-500 text-sm">Completed</p>
                <p className="text-2xl font-semibold text-emerald-400">{stats.completed}</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <p className="text-slate-500 text-sm">Failed</p>
                <p className="text-2xl font-semibold text-red-400">{stats.failed}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-800">
              <button
                onClick={() => setActiveTab('workflows')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'workflows'
                    ? 'text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Workflows
                </span>
              </button>
              <button
                onClick={() => setActiveTab('integrations')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'integrations'
                    ? 'text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  Integrations
                </span>
              </button>
            </div>

            {/* Workflows Tab */}
            {activeTab === 'workflows' && (
              <>
                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={filter === 'all' ? 'primary' : 'secondary'} 
                    size="sm"
                    onClick={() => setFilter('all')}
                  >
                    All
                  </Button>
                  <Button 
                    variant={filter === 'running' ? 'primary' : 'secondary'} 
                    size="sm"
                    onClick={() => setFilter('running')}
                  >
                    Running
                  </Button>
                  <Button 
                    variant={filter === 'queued' ? 'primary' : 'secondary'} 
                    size="sm"
                    onClick={() => setFilter('queued')}
                  >
                    Queued
                  </Button>
                  <Button 
                    variant={filter === 'completed' ? 'primary' : 'secondary'} 
                    size="sm"
                    onClick={() => setFilter('completed')}
                  >
                    Completed
                  </Button>
                  <Button 
                    variant={filter === 'failed' ? 'primary' : 'secondary'} 
                    size="sm"
                    onClick={() => setFilter('failed')}
                  >
                    Failed
                  </Button>
                </div>

                {/* Workflow Runs Table */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-slate-800 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <h2 className="text-lg font-semibold text-slate-100">Workflow Runs</h2>
                    <Badge variant="secondary" className="ml-2">{filteredRuns.length}</Badge>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-950/50">
                        <tr>
                          <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Workflow</th>
                          <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Agent</th>
                          <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Status</th>
                          <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Started</th>
                          <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Duration</th>
                          <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {filteredRuns.map((run) => {
                          const status = statusConfig[run.status];
                          return (
                            <tr 
                              key={run.id} 
                              className="hover:bg-slate-800/50 cursor-pointer"
                              onClick={() => setSelectedRun(selectedRun?.id === run.id ? null : run)}
                            >
                              <td className="p-4">
                                <p className="text-sm font-medium text-slate-200">{run.workflowName}</p>
                                <p className="text-xs text-slate-500">{run.id}</p>
                              </td>
                              <td className="p-4">
                                <span className="text-sm text-slate-300 capitalize">{run.assignedAgent}</span>
                              </td>
                              <td className="p-4">
                                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${status.color}/20`}>
                                  <div className={`w-2 h-2 rounded-full ${status.color}`} />
                                  <span className={`text-xs font-medium ${status.color.replace('bg-', 'text-')}`}>
                                    {status.label}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="text-sm text-slate-400">{formatTime(run.startedAt)}</span>
                              </td>
                              <td className="p-4">
                                <span className="text-sm text-slate-400">
                                  {formatDuration(run.startedAt, run.endedAt)}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex gap-1">
                                  {(run.status === 'running' || run.status === 'queued' || run.status === 'waiting') && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={(e) => { e.stopPropagation(); handleCancel(run.id); }}
                                      title="Cancel workflow"
                                    >
                                      <Ban className="w-4 h-4 text-slate-400" />
                                    </Button>
                                  )}
                                  {(run.status === 'failed' || run.status === 'blocked') && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={(e) => { e.stopPropagation(); handleRetry(run.id); }}
                                      title="Retry workflow"
                                    >
                                      <RotateCcw className="w-4 h-4 text-amber-400" />
                                    </Button>
                                  )}
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); handleViewLogs(run); }}
                                    title="View logs"
                                  >
                                    <FileText className="w-4 h-4 text-indigo-400" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); handleDelete(run.id); }}
                                    title="Delete run"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-400" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {filteredRuns.length === 0 && (
                    <div className="p-8 text-center">
                      <p className="text-slate-500">No workflow runs found</p>
                    </div>
                  )}
                </div>

                {/* Selected Run Detail */}
                {selectedRun && (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-5 h-5 text-indigo-400" />
                        <h2 className="text-lg font-semibold text-slate-100">Workflow Details</h2>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedRun(null)}>
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500">Run ID</p>
                          <p className="text-slate-200 font-mono">{selectedRun.id}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Workflow</p>
                          <p className="text-slate-200">{selectedRun.workflowName}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Agent</p>
                          <p className="text-slate-200 capitalize">{selectedRun.assignedAgent}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Status</p>
                          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${statusConfig[selectedRun.status].color}/20`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${statusConfig[selectedRun.status].color}`} />
                            <span className={`text-xs ${statusConfig[selectedRun.status].color.replace('bg-', 'text-')}`}>
                              {statusConfig[selectedRun.status].label}
                            </span>
                          </div>
                        </div>
                      </div>

                      {selectedRun.output && (
                        <div>
                          <p className="text-slate-500 text-sm mb-2">Output</p>
                          <div className="bg-slate-950 p-3 rounded-lg">
                            <p className="text-emerald-400 text-sm mb-2">{selectedRun.output.summary}</p>
                            <pre className="text-xs text-slate-300 overflow-x-auto">
                              {JSON.stringify(selectedRun.output.data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}

                      {selectedRun.error && (
                        <div>
                          <p className="text-slate-500 text-sm mb-2">Error</p>
                          <div className="bg-red-950/30 border border-red-900/50 p-3 rounded-lg">
                            <p className="text-red-400 text-sm">{selectedRun.error}</p>
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-slate-500 text-sm">Logs ({selectedRun.logs.length})</p>
                          <Button variant="ghost" size="sm" onClick={() => handleViewLogs(selectedRun)}>
                            <FileText className="w-4 h-4 mr-2" />
                            View Full Logs
                          </Button>
                        </div>
                        <div className="bg-slate-950 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                          {selectedRun.logs.slice(0, 10).map((log) => (
                            <div 
                              key={log.id} 
                              className={`px-3 py-2 text-xs font-mono border-b border-slate-900 last:border-0 ${
                                log.level === 'error' ? 'text-red-400 bg-red-950/10' :
                                log.level === 'warn' ? 'text-amber-400 bg-amber-950/10' :
                                log.level === 'debug' ? 'text-slate-500' :
                                'text-slate-300'
                              }`}
                            >
                              <span className="text-slate-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                              <span className={`ml-2 uppercase text-[10px] px-1 rounded ${
                                log.level === 'error' ? 'bg-red-900/50 text-red-300' :
                                log.level === 'warn' ? 'bg-amber-900/50 text-amber-300' :
                                log.level === 'debug' ? 'bg-slate-800 text-slate-400' :
                                'bg-emerald-900/50 text-emerald-300'
                              }`}>
                                {log.level}
                              </span>
                              {log.agent && <span className="ml-2 text-indigo-400">[{log.agent}]</span>}
                              <span className="ml-2">{log.message}</span>
                            </div>
                          ))}
                          {selectedRun.logs.length > 10 && (
                            <div className="px-3 py-2 text-xs text-slate-500 text-center">
                              ... {selectedRun.logs.length - 10} more logs
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <div className="p-8 text-center">
                <p className="text-slate-500">Integrations panel coming soon</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* View Logs Modal */}
      {logsRun && (
        <Modal
          isOpen={isLogsModalOpen}
          onClose={() => setIsLogsModalOpen(false)}
          title={`Logs: ${logsRun.workflowName}`}
          size="lg"
          footer={
            <Button variant="secondary" onClick={() => setIsLogsModalOpen(false)}>Close</Button>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-400">Run ID: <span className="text-slate-200 font-mono">{logsRun.id}</span></span>
              <span className="text-slate-400">Status: 
                <span className={`ml-1 ${statusConfig[logsRun.status].color.replace('bg-', 'text-')}`}>
                  {statusConfig[logsRun.status].label}
                </span>
              </span>
            </div>
            
            <div className="bg-slate-950 rounded-lg overflow-hidden max-h-96 overflow-y-auto border border-slate-800">
              {logsRun.logs.map((log) => (
                <div 
                  key={log.id} 
                  className={`px-3 py-2 text-xs font-mono border-b border-slate-900 last:border-0 ${
                    log.level === 'error' ? 'text-red-400 bg-red-950/10' :
                    log.level === 'warn' ? 'text-amber-400 bg-amber-950/10' :
                    log.level === 'debug' ? 'text-slate-500' :
                    'text-slate-300'
                  }`}
                >
                  <span className="text-slate-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className={`ml-2 uppercase text-[10px] px-1 rounded ${
                    log.level === 'error' ? 'bg-red-900/50 text-red-300' :
                    log.level === 'warn' ? 'bg-amber-900/50 text-amber-300' :
                    log.level === 'debug' ? 'bg-slate-800 text-slate-400' :
                    'bg-emerald-900/50 text-emerald-300'
                  }`}>
                    {log.level}
                  </span>
                  {log.agent && <span className="ml-2 text-indigo-400">[{log.agent}]</span>}
                  <span className="ml-2">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
