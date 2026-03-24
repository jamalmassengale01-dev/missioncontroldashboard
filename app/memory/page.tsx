'use client';

import React, { useState, useMemo } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MemoryEntry } from '@/components/memory/MemoryEntry';
import { MemoryFilters } from '@/components/memory/MemoryFilters';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { memoryEntries as initialEntries } from '@/lib/data';
import { MemoryEntry as MemoryEntryType, MemoryTag } from '@/lib/types';
import { Plus, Brain, Trash2, Edit3, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

const allTags: MemoryTag[] = ['Research', 'Content', 'Strategy', 'Technical', 'Decisions'];

export default function MemoryPage() {
  const [entries, setEntries] = useState<MemoryEntryType[]>(initialEntries);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<MemoryTag | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<MemoryEntryType | null>(null);

  // Form state
  const [newEntry, setNewEntry] = useState<Partial<MemoryEntryType>>({
    title: '',
    summary: '',
    content: '',
    tags: [],
  });

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch = !searchQuery ||
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.summary.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTag = !selectedTag || entry.tags.includes(selectedTag);

      return matchesSearch && matchesTag;
    });
  }, [entries, searchQuery, selectedTag]);

  const handleAddMemory = () => {
    setNewEntry({ title: '', summary: '', content: '', tags: [] });
    setIsAddModalOpen(true);
  };

  const handleSaveNewEntry = () => {
    if (!newEntry.title) return;

    const entry: MemoryEntryType = {
      id: `mem-${Date.now()}`,
      title: newEntry.title || '',
      summary: newEntry.summary || '',
      content: newEntry.content || '',
      tags: newEntry.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setEntries(prev => [entry, ...prev]);
    setIsAddModalOpen(false);
  };

  const handleEntryClick = (entry: MemoryEntryType) => {
    setSelectedEntry(entry);
    setIsViewModalOpen(true);
  };

  const handleEditEntry = () => {
    if (selectedEntry) {
      setNewEntry(selectedEntry);
      setIsViewModalOpen(false);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveEdit = () => {
    if (!selectedEntry || !newEntry.title) return;

    setEntries(prev => prev.map(e =>
      e.id === selectedEntry.id
        ? { ...e, ...newEntry, updatedAt: new Date().toISOString() } as MemoryEntryType
        : e
    ));
    setIsEditModalOpen(false);
    setSelectedEntry(null);
  };

  const handleDeleteEntry = (entryId: string) => {
    setEntries(prev => prev.filter(e => e.id !== entryId));
    if (selectedEntry?.id === entryId) {
      setIsViewModalOpen(false);
      setIsEditModalOpen(false);
      setSelectedEntry(null);
    }
  };

  const toggleTag = (tag: MemoryTag) => {
    const currentTags = newEntry.tags || [];
    if (currentTags.includes(tag)) {
      setNewEntry({ ...newEntry, tags: currentTags.filter(t => t !== tag) });
    } else {
      setNewEntry({ ...newEntry, tags: [...currentTags, tag] });
    }
  };

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-64">
        <TopBar title="Memory" />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">

            {/* Agent Instructions Banner */}
            <div className="mb-6 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
              <button
                onClick={() => setShowInstructions(prev => !prev)}
                className="w-full flex items-center justify-between px-5 py-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-semibold text-indigo-300">Agent Instructions — How to Use This Memory Store</span>
                </div>
                {showInstructions
                  ? <ChevronUp className="w-4 h-4 text-indigo-400" />
                  : <ChevronDown className="w-4 h-4 text-indigo-400" />
                }
              </button>

              {showInstructions && (
                <div className="px-5 pb-5 text-sm text-slate-400 space-y-3 border-t border-indigo-500/10 pt-4">
                  <p className="text-slate-300 font-medium">Use this store for persistent knowledge that must survive across sessions.</p>
                  <ul className="space-y-2 ml-2">
                    <li className="flex gap-2">
                      <span className="text-indigo-400 mt-0.5">▸</span>
                      <span><span className="text-slate-200 font-medium">Research</span> — Validated facts, market findings, competitor analysis, data points</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-indigo-400 mt-0.5">▸</span>
                      <span><span className="text-slate-200 font-medium">Content</span> — Approved scripts, copy, hooks, outlines ready for publishing</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-indigo-400 mt-0.5">▸</span>
                      <span><span className="text-slate-200 font-medium">Strategy</span> — GTM plans, funnel designs, long-term roadmaps</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-indigo-400 mt-0.5">▸</span>
                      <span><span className="text-slate-200 font-medium">Technical</span> — Architecture decisions, code patterns, stack choices</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-indigo-400 mt-0.5">▸</span>
                      <span><span className="text-slate-200 font-medium">Decisions</span> — Chief Architect approved choices that cannot be re-litigated</span>
                    </li>
                  </ul>
                  <p className="text-slate-500 text-xs pt-1">
                    When reading context: filter by tag first, then scan summaries before reading full content. Always write a 1–2 sentence summary so other agents can retrieve without reading the full entry.
                  </p>
                </div>
              )}
            </div>

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
              <Button onClick={handleAddMemory}>
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
                <MemoryEntry
                  key={entry.id}
                  entry={entry}
                  onClick={() => handleEntryClick(entry)}
                  onDelete={() => handleDeleteEntry(entry.id)}
                />
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

      {/* Add Memory Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Memory"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveNewEntry}>Save Memory</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Title</label>
            <input
              type="text"
              value={newEntry.title || ''}
              onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
              placeholder="Enter memory title..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Summary <span className="text-slate-600 font-normal">(1–2 sentences for agent quick-scan)</span></label>
            <textarea
              value={newEntry.summary || ''}
              onChange={(e) => setNewEntry({ ...newEntry, summary: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 resize-none"
              rows={2}
              placeholder="Brief summary agents can read at a glance..."
            />
            <p className="text-xs text-slate-600 mt-1">{(newEntry.summary || '').length} chars</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Content</label>
            <textarea
              value={newEntry.content || ''}
              onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 resize-none"
              rows={5}
              placeholder="Full content..."
            />
            <p className="text-xs text-slate-600 mt-1">{(newEntry.content || '').length} chars</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Tags</label>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    (newEntry.tags || []).includes(tag)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* View Memory Modal */}
      {selectedEntry && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={selectedEntry.title}
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsViewModalOpen(false)}>Close</Button>
              <Button variant="secondary" onClick={handleEditEntry}>
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="danger" onClick={() => handleDeleteEntry(selectedEntry.id)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {selectedEntry.tags.map((tag) => (
                <Badge key={tag} variant="secondary" size="sm">{tag}</Badge>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Summary</label>
              <p className="text-slate-300">{selectedEntry.summary}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Content</label>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                <p className="text-slate-300 whitespace-pre-wrap">{selectedEntry.content || 'No content available.'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>Created: {new Date(selectedEntry.createdAt).toLocaleDateString()}</span>
              <span>Updated: {new Date(selectedEntry.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Memory Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Memory"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Title</label>
            <input
              type="text"
              value={newEntry.title || ''}
              onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Summary</label>
            <textarea
              value={newEntry.summary || ''}
              onChange={(e) => setNewEntry({ ...newEntry, summary: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 resize-none"
              rows={2}
            />
            <p className="text-xs text-slate-600 mt-1">{(newEntry.summary || '').length} chars</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Content</label>
            <textarea
              value={newEntry.content || ''}
              onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 resize-none"
              rows={5}
            />
            <p className="text-xs text-slate-600 mt-1">{(newEntry.content || '').length} chars</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Tags</label>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    (newEntry.tags || []).includes(tag)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
