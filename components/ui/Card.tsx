import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-slate-900/50 border border-slate-800 rounded-lg shadow-sm ${
        onClick ? 'cursor-pointer hover:border-slate-700 transition-colors' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
