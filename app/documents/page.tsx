'use client';

import React, { useState, useMemo } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { CategoryFilter } from '@/components/documents/CategoryFilter';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { documents as initialDocuments } from '@/lib/data';
import { Document, DocumentCategory } from '@/lib/types';
import { Plus, FileText, Trash2, Edit3 } from 'lucide-react';

const allCategories: DocumentCategory[] = ['Strategy', 'Content', 'Technical', 'Operations', 'Research'];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | null>(null);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  
  // Form state
  const [newDocument, setNewDocument] = useState<Partial<Document>>({
    title: '',
    category: 'Strategy',
    content: '',
  });

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = !searchQuery ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !selectedCategory || doc.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [documents, searchQuery, selectedCategory]);

  const handleCreateDocument = () => {
    setNewDocument({
      title: '',
      category: 'Strategy',
      content: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveNewDocument = () => {
    if (!newDocument.title) return;
    
    const doc: Document = {
      id: `doc-${Date.now()}`,
      title: newDocument.title || '',
      category: newDocument.category || 'Strategy',
      content: newDocument.content || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setDocuments(prev => [doc, ...prev]);
    setIsCreateModalOpen(false);
  };

  const handleDocumentClick = (doc: Document) => {
    setSelectedDocument(doc);
    setIsViewModalOpen(true);
  };

  const handleEditDocument = () => {
    if (selectedDocument) {
      setNewDocument(selectedDocument);
      setIsViewModalOpen(false);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveEdit = () => {
    if (!selectedDocument || !newDocument.title) return;
    
    setDocuments(prev => prev.map(d => 
      d.id === selectedDocument.id 
        ? { ...d, ...newDocument, updatedAt: new Date().toISOString() } as Document
        : d
    ));
    setIsEditModalOpen(false);
    setSelectedDocument(null);
  };

  const handleDeleteDocument = (docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
    if (selectedDocument?.id === docId) {
      setIsViewModalOpen(false);
      setIsEditModalOpen(false);
      setSelectedDocument(null);
    }
  };

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
              <Button onClick={handleCreateDocument}>
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
                <DocumentCard 
                  key={doc.id} 
                  document={doc} 
                  onClick={() => handleDocumentClick(doc)}
                  onDelete={() => handleDeleteDocument(doc.id)}
                />
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

      {/* Create Document Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Document"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveNewDocument}>Create Document</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Title</label>
            <input
              type="text"
              value={newDocument.title || ''}
              onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
              placeholder="Enter document title..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Category</label>
            <select
              value={newDocument.category}
              onChange={(e) => setNewDocument({ ...newDocument, category: e.target.value as DocumentCategory })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
            >
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Content</label>
            <textarea
              value={newDocument.content || ''}
              onChange={(e) => setNewDocument({ ...newDocument, content: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 resize-none"
              rows={6}
              placeholder="Enter document content..."
            />
          </div>
        </div>
      </Modal>

      {/* View Document Modal */}
      {selectedDocument && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={selectedDocument.title}
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsViewModalOpen(false)}>Close</Button>
              <Button variant="secondary" onClick={handleEditDocument}>
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="danger" onClick={() => handleDeleteDocument(selectedDocument.id)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" size="sm">{selectedDocument.category}</Badge>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Content</label>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                <p className="text-slate-300 whitespace-pre-wrap">{selectedDocument.content || 'No content available.'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>Created: {new Date(selectedDocument.createdAt).toLocaleDateString()}</span>
              <span>Updated: {new Date(selectedDocument.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Document Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Document"
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
              value={newDocument.title || ''}
              onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Category</label>
            <select
              value={newDocument.category}
              onChange={(e) => setNewDocument({ ...newDocument, category: e.target.value as DocumentCategory })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
            >
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Content</label>
            <textarea
              value={newDocument.content || ''}
              onChange={(e) => setNewDocument({ ...newDocument, content: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 resize-none"
              rows={6}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
