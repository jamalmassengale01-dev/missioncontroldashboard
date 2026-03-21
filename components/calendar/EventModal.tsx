'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CalendarEvent, EventType } from '@/lib/types';
import { format } from 'date-fns';
import { Calendar, Clock, FileText, Link2 } from 'lucide-react';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
}

const eventTypeLabels: Record<EventType, string> = {
  task: 'Task Due',
  automation: 'Automation Event',
  workflow: 'Workflow Schedule',
  trading: 'Trading Window',
  meeting: 'Meeting',
};

const eventTypeColors: Record<EventType, string> = {
  task: 'primary',
  automation: 'success',
  workflow: 'info',
  trading: 'warning',
  meeting: 'default',
};

export function EventModal({ isOpen, onClose, event }: EventModalProps) {
  if (!event) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Event Details"
      footer={
        <Button onClick={onClose}>Close</Button>
      }
    >
      <div className="space-y-4">
        {/* Title and Type */}
        <div>
          <Badge variant={eventTypeColors[event.type] as any} className="mb-2">
            {eventTypeLabels[event.type]}
          </Badge>
          <h2 className="text-xl font-bold text-slate-100">{event.title}</h2>
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-slate-300">{event.description}</p>
        )}

        {/* Date and Time */}
        <div className="bg-slate-800/50 p-4 rounded-lg space-y-3">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-slate-400" />
            <div>
              <div className="text-sm text-slate-400">Date</div>
              <div className="text-slate-200">
                {format(event.start, 'EEEE, MMMM d, yyyy')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-slate-400" />
            <div>
              <div className="text-sm text-slate-400">Time</div>
              <div className="text-slate-200">
                {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
              </div>
            </div>
          </div>

          {event.allDay && (
            <Badge variant="default" size="sm">All Day</Badge>
          )}
        </div>

        {/* Related Items */}
        {(event.relatedTaskId || event.relatedProjectId) && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-400">Related Items</h3>
            {event.relatedTaskId && (
              <div className="flex items-center gap-2 text-slate-300">
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Task: {event.relatedTaskId}</span>
              </div>
            )}
            {event.relatedProjectId && (
              <div className="flex items-center gap-2 text-slate-300">
                <Link2 className="w-4 h-4 text-slate-500" />
                <span>Project: {event.relatedProjectId}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
