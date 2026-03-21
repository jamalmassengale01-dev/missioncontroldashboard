'use client';

import React from 'react';
import { DocumentCategory } from '@/lib/types';
import { Search } from 'lucide-react';

interface CategoryFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: DocumentCategory | null;
  onCategoryChange: (category: DocumentCategory | null) => void;
}

const categories: DocumentCategory[] = ['Strategy', 'Content', 'Technical', 'Operations', 'Research'];

export function CategoryFilter({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
        />
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onCategoryChange(null)}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            selectedCategory === null
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              selectedCategory === category
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
