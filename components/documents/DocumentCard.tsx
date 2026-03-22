'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Document, DocumentCategory } from '@/lib/types';
import { FileText, Calendar, Folder, Trash2 } from 'lucide-react';

interface DocumentCardProps {
  document: Document;
  onClick?: () => void;
  onDelete?: () => void;
}

const categoryColors: Record<DocumentCategory, string> = {
  Strategy: 'primary',
  Content: 'success',
  Technical: 'info',
  Operations: 'warning',
  Research: 'default',
};

export function DocumentCard({ document, onClick, onDelete }: DocumentCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <Card onClick={onClick} className="p-5 hover:border-indigo-500/30 transition-all cursor-pointer group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <h3 className="font-semibold text-slate-100 line-clamp-1">{document.title}</h3>
        </div>
        {onDelete && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </Button>
        )}
      </div>

      {/* Category */}
      <div className="mb-4">
        <Badge variant={categoryColors[document.category] as any} size="sm">
          {document.category}
        </Badge>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>Created {new Date(document.createdAt).toLocaleDateString()}</span>
        </div>
        {document.relatedProjectId && (
          <div className="flex items-center gap-1">
            <Folder className="w-3 h-3" />
            <span>Project</span>
          </div>
        )}
      </div>
    </Card>
  );
}
