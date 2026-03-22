'use client';

import React, { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, subMonths } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { CalendarEvent, EventType } from '@/lib/types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const eventTypeColors: Record<EventType, string> = {
  task: '#6366f1',      // indigo
  automation: '#10b981', // emerald
  workflow: '#8b5cf6',   // violet
  trading: '#f59e0b',    // amber
  meeting: '#06b6d4',    // cyan
};

const eventTypeLabels: Record<EventType, string> = {
  task: 'Task Due',
  automation: 'Automation',
  workflow: 'Workflow',
  trading: 'Trading',
  meeting: 'Meeting',
};

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export function CalendarView({ events, onEventClick }: CalendarViewProps) {
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date(2026, 2, 21)); // March 21, 2026

  const calendarEvents = useMemo(() => {
    return events.map(event => ({
      ...event,
      resource: event,
    }));
  }, [events]);

  const eventStyleGetter = (event: any) => {
    const calendarEvent = event.resource as CalendarEvent;
    return {
      style: {
        backgroundColor: eventTypeColors[calendarEvent.type],
        borderRadius: '6px',
        border: 'none',
        color: 'white',
        fontSize: '0.75rem',
        fontWeight: 500,
        padding: '3px 6px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
      },
    };
  };

  const handlePrev = () => {
    if (view === 'month') {
      setDate(subMonths(date, 1));
    }
  };

  const handleNext = () => {
    if (view === 'month') {
      setDate(addMonths(date, 1));
    }
  };

  const handleToday = () => {
    setDate(new Date(2026, 2, 21));
  };

  // Custom day cell wrapper to improve styling
  const dayPropGetter = (date: Date) => {
    const today = new Date(2026, 2, 21);
    const isToday = date.toDateString() === today.toDateString();
    return {
      className: isToday ? 'rbc-today-custom' : '',
      style: {
        backgroundColor: isToday ? 'rgba(99, 102, 241, 0.1)' : undefined,
      },
    };
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handlePrev}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Button variant="secondary" size="sm" onClick={handleNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-lg font-semibold text-slate-100 ml-2">
            {format(date, 'MMMM yyyy')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800 rounded-lg p-1">
            {(['month', 'week', 'day'] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  view === v
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 flex-shrink-0">
        {(Object.keys(eventTypeColors) as EventType[]).map((type) => (
          <div key={type} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: eventTypeColors[type] }}
            />
            <span className="text-xs text-slate-400">{eventTypeLabels[type]}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="flex-1 bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          eventPropGetter={eventStyleGetter}
          dayPropGetter={dayPropGetter}
          onSelectEvent={(event) => onEventClick(event.resource)}
          className="h-full mission-control-calendar"
          components={{
            toolbar: () => null, // Custom toolbar above
          }}
        />
      </div>

      <style jsx global>{`
        .mission-control-calendar .rbc-calendar {
          background-color: transparent;
        }
        .mission-control-calendar .rbc-header {
          background-color: rgba(15, 23, 42, 0.8);
          border-bottom: 1px solid rgba(51, 65, 85, 0.5);
          color: #94a3b8;
          font-weight: 500;
          font-size: 0.75rem;
          padding: 8px 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .mission-control-calendar .rbc-month-view {
          border: none;
          border-radius: 0.75rem;
        }
        .mission-control-calendar .rbc-month-row {
          border-bottom: 1px solid rgba(51, 65, 85, 0.3);
        }
        .mission-control-calendar .rbc-month-row:last-child {
          border-bottom: none;
        }
        .mission-control-calendar .rbc-day-bg {
          border-left: 1px solid rgba(51, 65, 85, 0.3);
        }
        .mission-control-calendar .rbc-day-bg:first-child {
          border-left: none;
        }
        .mission-control-calendar .rbc-date-cell {
          color: #cbd5e1;
          font-size: 0.875rem;
          padding: 4px 8px;
          text-align: right;
        }
        .mission-control-calendar .rbc-date-cell.rbc-now {
          color: #6366f1;
          font-weight: 600;
        }
        .mission-control-calendar .rbc-off-range-bg {
          background-color: rgba(15, 23, 42, 0.5);
        }
        .mission-control-calendar .rbc-off-range {
          color: #475569;
        }
        .mission-control-calendar .rbc-today {
          background-color: rgba(99, 102, 241, 0.08);
        }
        .mission-control-calendar .rbc-event {
          border-radius: 4px;
          padding: 2px 4px;
          font-size: 0.7rem;
        }
        .mission-control-calendar .rbc-event-content {
          font-size: 0.7rem;
          line-height: 1.2;
        }
        .mission-control-calendar .rbc-time-view {
          border: none;
        }
        .mission-control-calendar .rbc-time-header {
          background-color: rgba(15, 23, 42, 0.8);
          border-bottom: 1px solid rgba(51, 65, 85, 0.5);
        }
        .mission-control-calendar .rbc-time-content {
          border-top: none;
        }
        .mission-control-calendar .rbc-time-slot {
          color: #64748b;
          font-size: 0.75rem;
        }
        .mission-control-calendar .rbc-current-time-indicator {
          background-color: #6366f1;
          height: 2px;
        }
        .mission-control-calendar .rbc-show-more {
          color: #6366f1;
          font-size: 0.75rem;
          background-color: transparent;
        }
        .mission-control-calendar .rbc-row-segment {
          padding: 1px 2px;
        }
      `}</style>
    </div>
  );
}
