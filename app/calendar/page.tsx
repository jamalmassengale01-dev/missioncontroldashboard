'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { CalendarView } from '@/components/calendar/CalendarView';
import { EventModal } from '@/components/calendar/EventModal';
import { calendarEvents } from '@/lib/data';
import { CalendarEvent } from '@/lib/types';

export default function CalendarPage() {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-64">
        <TopBar title="Calendar" />
        <main className="flex-1 overflow-hidden p-4 lg:p-8">
          <div className="h-full max-w-7xl mx-auto flex flex-col">
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-2xl font-semibold text-slate-100">Calendar</h1>
              <p className="text-slate-500 text-sm mt-1">
                Schedule and track all activities
              </p>
            </div>

            {/* Calendar */}
            <div className="flex-1 min-h-0">
              <CalendarView
                events={calendarEvents}
                onEventClick={handleEventClick}
              />
            </div>
          </div>
        </main>
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={selectedEvent}
      />
    </div>
  );
}
