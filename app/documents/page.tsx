'use client';

import React, { useState, useMemo } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { CategoryFilter } from '@/components/documents/CategoryFilter';
import { Button } from '@/components/ui/Button';
import { documents } from '@/lib/data';
import { DocumentCategory } from '@/lib/types';
import { Plus, FileText } from 'lucide-react';

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | null>(null);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = !searchQuery ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !selectedCategory || doc.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-64">
        <TopBar title="Documents" />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-slate-100">Document Library</h1>
                  <p className="text-slate-500 text-sm">Browse and manage documents</p>
                </div>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Document
              </Button>
            </div>

            {/* Filters */}
            <div className="mb-6">
              <CategoryFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
            </div>

            {/* Documents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((doc) => (
                <DocumentCard key={doc.id} document={doc} />
              ))}
            </div>

            {filteredDocuments.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p>No documents found matching your search.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
