'use client';

import React from 'react';
import { Bell, Search } from 'lucide-react';

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="flex items-center justify-between h-16 px-4 lg:px-8">
        {/* Title - offset for mobile menu button */}
        <h1 className="text-xl font-semibold text-slate-100 ml-12 lg:ml-0">{title}</h1>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-sm text-slate-300 placeholder-slate-500 w-48"
            />
          </div>
          <button className="relative p-2 text-slate-400 hover:text-slate-200 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
          </button>
        </div>
      </div>
    </header>
  );
}
