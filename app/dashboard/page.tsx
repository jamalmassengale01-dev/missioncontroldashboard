'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { agents, tasks } from '@/lib/data';
import {
  LayoutDashboard,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  FolderKanban,
} from 'lucide-react';

export default function DashboardPage() {
  const stats = {
    totalTasks: tasks.length,
    inProgress: tasks.filter((t) => t.status === 'In Progress').length,
    completed: tasks.filter((t) => t.status === 'Done').length,
    blocked: tasks.filter((t) => t.status === 'Review').length,
    activeAgents: agents.filter((a) => a.status === 'working').length,
    criticalTasks: tasks.filter((t) => t.priority === 'Critical').length,
  };

  const recentTasks = tasks
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
    .slice(0, 5);

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-64">
        <TopBar title="Dashboard" />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                    <LayoutDashboard className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-slate-100">{stats.totalTasks}</p>
                    <p className="text-xs text-slate-500">Total Tasks</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-slate-100">{stats.inProgress}</p>
                    <p className="text-xs text-slate-500">In Progress</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-slate-100">{stats.completed}</p>
                    <p className="text-xs text-slate-500">Completed</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-500/20 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-slate-100">{stats.criticalTasks}</p>
                    <p className="text-xs text-slate-500">Critical</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-slate-100">{stats.activeAgents}</p>
                    <p className="text-xs text-slate-500">Active Agents</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-slate-100">
                      {Math.round((stats.completed / stats.totalTasks) * 100)}%
                    </p>
                    <p className="text-xs text-slate-500">Completion</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Tasks */}
              <Card className="lg:col-span-2 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-100">Recent Tasks</h2>
                  <a href="/tasks" className="text-sm text-indigo-400 hover:text-indigo-300">
                    View all →
                  </a>
                </div>
                <div className="space-y-3">
                  {recentTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg border border-slate-800"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-slate-200 truncate">{task.title}</p>
                          <Badge
                            variant={
                              task.priority === 'Critical'
                                ? 'danger'
                                : task.priority === 'High'
                                ? 'warning'
                                : task.priority === 'Medium'
                                ? 'primary'
                                : 'default'
                            }
                            className="text-xs"
                          >
                            {task.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">{task.assignedAgent} • {task.project}</p>
                      </div>
                      <Badge
                        variant={
                          task.status === 'Done'
                            ? 'success'
                            : task.status === 'In Progress'
                            ? 'primary'
                            : task.status === 'Review'
                            ? 'warning'
                            : 'default'
                        }
                        className="ml-3"
                      >
                        {task.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Team Status */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-100">Team Status</h2>
                  <a href="/team" className="text-sm text-indigo-400 hover:text-indigo-300">
                    View all →
                  </a>
                </div>
                <div className="space-y-3">
                  {agents.map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-center gap-3 p-3 bg-slate-950/50 rounded-lg border border-slate-800"
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          agent.status === 'working'
                            ? 'bg-emerald-500'
                            : agent.status === 'idle'
                            ? 'bg-slate-500'
                            : agent.status === 'blocked'
                            ? 'bg-amber-500'
                            : 'bg-slate-700'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200">{agent.name}</p>
                        <p className="text-xs text-slate-500 truncate">{agent.currentFocus}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
