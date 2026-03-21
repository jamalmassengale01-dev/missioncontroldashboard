'use client';

import React from 'react';
import { MemoryTag } from '@/lib/types';
import { Search } from 'lucide-react';

interface MemoryFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTag: MemoryTag | null;
  onTagChange: (tag: MemoryTag | null) => void;
}

const tags: MemoryTag[] = ['Research', 'Content', 'Strategy', 'Technical', 'Decisions'];

export function MemoryFilters({
  searchQuery,
  onSearchChange,
  selectedTag,
  onTagChange,
}: MemoryFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search memories..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
        />
      </div>

      {/* Tag Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onTagChange(null)}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            selectedTag === null
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          All
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => onTagChange(tag)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              selectedTag === tag
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
