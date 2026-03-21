'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MemoryEntry as MemoryEntryType, MemoryTag } from '@/lib/types';
import { Brain, Calendar } from 'lucide-react';

interface MemoryEntryProps {
  entry: MemoryEntryType;
  onClick?: () => void;
}

const tagColors: Record<MemoryTag, string> = {
  Research: 'primary',
  Content: 'success',
  Strategy: 'warning',
  Technical: 'info',
  Decisions: 'default',
};

export function MemoryEntry({ entry, onClick }: MemoryEntryProps) {
  return (
    <Card onClick={onClick} className="p-5 hover:border-indigo-500/30 transition-all cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <Brain className="w-4 h-4 text-purple-400" />
          </div>
          <h3 className="font-semibold text-slate-100 line-clamp-1">{entry.title}</h3>
        </div>
      </div>

      <p className="text-sm text-slate-400 mb-4 line-clamp-2">{entry.summary}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {entry.tags.map((tag) => (
          <Badge key={tag} variant={tagColors[tag] as any} size="sm">
            {tag}
          </Badge>
        ))}
      </div>

      {/* Date */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Calendar className="w-3 h-3" />
        <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
      </div>
    </Card>
  );
}
