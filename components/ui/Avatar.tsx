import React from 'react';

interface AvatarProps {
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
};

export function Avatar({ name, className = '', size = 'md' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Generate a consistent color based on name
  const colors = [
    'bg-indigo-600',
    'bg-purple-600',
    'bg-violet-600',
    'bg-fuchsia-600',
    'bg-sky-600',
    'bg-cyan-600',
    'bg-teal-600',
  ];
  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  const bgColor = colors[colorIndex];

  return (
    <div
      className={`${bgColor} ${sizeStyles[size]} rounded-full flex items-center justify-center text-white font-semibold ${className}`}
    >
      {initials}
    </div>
  );
}
