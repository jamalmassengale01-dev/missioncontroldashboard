'use client';

import React from 'react';
import { DecisionItem } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { HelpCircle, CheckCircle2, Clock, Lightbulb } from 'lucide-react';

interface DecisionQueueProps {
  items: DecisionItem[];
  onDecide?: (id: string, option: number) => void;
}

const statusColors = {
  pending: 'warning',
  decided: 'success',
  deferred: 'default',
} as const;

export function DecisionQueue({ items, onDecide }: DecisionQueueProps) {
  const pendingItems = items.filter(i => i.status === 'pending');

  return (
    <div className="space-y-4">
      {pendingItems.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500/50" />
          <p>No pending decisions</p>
        </div>
      ) : (
        pendingItems.map((item) => (
          <div
            key={item.id}
            className="p-4 bg-slate-800/30 rounded-lg border border-slate-800"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <h4 className="font-medium text-slate-200">{item.title}</h4>
              </div>
              <Badge variant={statusColors[item.status] as any} size="sm">
                {item.status}
              </Badge>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-400 mb-2">{item.description}</p>
            <p className="text-sm text-slate-500 mb-4">{item.context}</p>

            {/* Options */}
            <div className="space-y-2 mb-4">
              {item.options.map((option, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    item.recommendedOption === index
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : 'border-slate-700 bg-slate-800/30'
                  }`}
                >
                  {item.recommendedOption === index && (
                    <Lightbulb className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  )}
                  <span className="text-sm text-slate-300 flex-1">{option}</span>
                  {onDecide && (
                    <Button
                      size="sm"
                      variant={item.recommendedOption === index ? 'primary' : 'secondary'}
                      onClick={() => onDecide(item.id, index)}
                    >
                      Select
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Due Date */}
            {item.dueDate && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                <span>Decision needed by {new Date(item.dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
