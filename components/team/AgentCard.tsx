'use client';

import React, { useState } from 'react';
import { Agent } from '@/lib/types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Circle, Clock, AlertCircle, Power, Activity, Plus, ChevronDown, ChevronUp } from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
  onAssignTask?: () => void;
  onViewActivity?: () => void;
  isShowingActivity?: boolean;
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  idle: { color: 'bg-slate-500', icon: <Circle className="w-3 h-3" />, label: 'Idle' },
  working: { color: 'bg-emerald-500', icon: <Activity className="w-3 h-3" />, label: 'Working' },
  blocked: { color: 'bg-amber-500', icon: <AlertCircle className="w-3 h-3" />, label: 'Blocked' },
  offline: { color: 'bg-slate-700', icon: <Power className="w-3 h-3" />, label: 'Offline' },
  running: { color: 'bg-amber-500', icon: <Activity className="w-3 h-3" />, label: 'Running' },
  completed: { color: 'bg-emerald-500', icon: <Activity className="w-3 h-3" />, label: 'Completed' },
  failed: { color: 'bg-red-500', icon: <AlertCircle className="w-3 h-3" />, label: 'Failed' },
};

export function AgentCard({ agent, onAssignTask, onViewActivity, isShowingActivity }: AgentCardProps) {
  const status = statusConfig[agent.status] || statusConfig.idle;
  const [showAllCaps, setShowAllCaps] = useState(false);

  const visibleCaps = showAllCaps ? agent.capabilities : agent.capabilities.slice(0, 4);
  const extraCount = agent.capabilities.length - 4;

  return (
    <Card className="p-5 h-full flex flex-col">
      <div className="flex items-start gap-4 mb-4">
        <Avatar name={agent.name} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-slate-100 truncate">{agent.name}</h3>
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${status.color}/20`}>
              <div className={`w-2 h-2 rounded-full ${status.color}`} />
              <span className={`text-xs font-medium ${status.color.replace('bg-', 'text-')}`}>
                {status.label}
              </span>
            </div>
          </div>
          <p className="text-sm text-indigo-400 font-medium">{agent.role}</p>
        </div>
      </div>

      <div className="space-y-3 mb-4 flex-1">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Current Focus</p>
          <p className="text-sm text-slate-300">{agent.currentFocus}</p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="w-3 h-3" />
          <span>Last activity: {agent.lastActivity}</span>
        </div>

        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Capabilities</p>
          <ul className="space-y-1">
            {visibleCaps.map((capability, index) => (
              <li key={index} className="text-sm text-slate-400 flex items-start gap-2">
                <span className="text-indigo-500 mt-1">•</span>
                <span>{capability}</span>
              </li>
            ))}
          </ul>
          {extraCount > 0 && (
            <button
              onClick={() => setShowAllCaps(prev => !prev)}
              className="mt-1.5 flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {showAllCaps ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  +{extraCount} more
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t border-slate-800">
        <Button variant="secondary" size="sm" className="flex-1" onClick={onAssignTask}>
          <Plus className="w-3 h-3 mr-1" />
          Assign Task
        </Button>
        {onViewActivity && (
          <Button
            variant={isShowingActivity ? 'primary' : 'ghost'}
            size="sm"
            onClick={onViewActivity}
            title="View recent runs"
          >
            <Activity className="w-3 h-3" />
          </Button>
        )}
      </div>
    </Card>
  );
}
