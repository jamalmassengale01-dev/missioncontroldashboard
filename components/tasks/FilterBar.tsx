'use client';

import React from 'react';
import { Filter, Search } from 'lucide-react';
import { agents, projects } from '@/lib/data';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedAgent: string | null;
  onAgentChange: (value: string | null) => void;
  selectedProject: string | null;
  onProjectChange: (value: string | null) => void;
  selectedPriority: string | null;
  onPriorityChange: (value: string | null) => void;
}

const priorities = ['Low', 'Medium', 'High', 'Critical'];
const agentNames = agents.map((a) => a.name);

export function FilterBar({
  searchQuery,
  onSearchChange,
  selectedAgent,
  onAgentChange,
  selectedProject,
  onProjectChange,
  selectedPriority,
  onPriorityChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-lg">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={selectedAgent || ''}
          onChange={(e) => onAgentChange(e.target.value || null)}
          className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50"
        >
          <option value="">All Agents</option>
          {agentNames.map((agent) => (
            <option key={agent} value={agent}>
              {agent}
            </option>
          ))}
        </select>

        <select
          value={selectedProject || ''}
          onChange={(e) => onProjectChange(e.target.value || null)}
          className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50"
        >
          <option value="">All Projects</option>
          {projects.map((project) => (
            <option key={project} value={project}>
              {project}
            </option>
          ))}
        </select>

        <select
          value={selectedPriority || ''}
          onChange={(e) => onPriorityChange(e.target.value || null)}
          className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50"
        >
          <option value="">All Priorities</option>
          {priorities.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>

        {(selectedAgent || selectedProject || selectedPriority || searchQuery) && (
          <button
            onClick={() => {
              onAgentChange(null);
              onProjectChange(null);
              onPriorityChange(null);
              onSearchChange('');
            }}
            className="px-3 py-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
