'use client';

import React, { useState, useMemo } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MemoryEntry } from '@/components/memory/MemoryEntry';
import { MemoryFilters } from '@/components/memory/MemoryFilters';
import { Button } from '@/components/ui/Button';
import { memoryEntries } from '@/lib/data';
import { MemoryTag } from '@/lib/types';
import { Plus, Brain } from 'lucide-react';

export default function MemoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<MemoryTag | null>(null);

  const filteredEntries = useMemo(() => {
    return memoryEntries.filter((entry) => {
      const matchesSearch = !searchQuery ||
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.summary.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTag = !selectedTag || entry.tags.includes(selectedTag);
      
      return matchesSearch && matchesTag;
    });
  }, [searchQuery, selectedTag]);

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-64">
        <TopBar title="Memory" />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Brain className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-slate-100">Memory Viewer</h1>
                  <p className="text-slate-500 text-sm">Search and browse knowledge base</p>
                </div>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Memory
              </Button>
            </div>

            {/* Filters */}
            <div className="mb-6">
              <MemoryFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedTag={selectedTag}
                onTagChange={setSelectedTag}
              />
            </div>

            {/* Memory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEntries.map((entry) => (
                <MemoryEntry key={entry.id} entry={entry} />
              ))}
            </div>

            {filteredEntries.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Brain className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p>No memories found matching your search.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
