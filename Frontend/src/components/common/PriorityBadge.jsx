import React from 'react';
import { cn } from '../../utils/cn';

export function PriorityBadge({ priority = 'MEDIUM', className = '' }) {
  const norm = String(priority).toUpperCase();

  let styles = 'bg-surface-container-high text-on-surface-variant border-outline-variant';
  let dotColor = 'bg-gray-400';

  if (norm === 'CRITICAL' || norm === 'P1') {
    styles = 'bg-error-container text-error font-bold border-error/30';
    dotColor = 'bg-error';
  } else if (norm === 'HIGH' || norm === 'P2') {
    styles = 'bg-orange-100 text-orange-900 font-semibold border-orange-300';
    dotColor = 'bg-orange-600';
  } else if (norm === 'MEDIUM' || norm === 'P3') {
    styles = 'bg-amber-100 text-amber-900 font-medium border-amber-300';
    dotColor = 'bg-amber-600';
  } else if (norm === 'LOW' || norm === 'P4') {
    styles = 'bg-slate-100 text-slate-700 font-medium border-slate-300';
    dotColor = 'bg-slate-500';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs uppercase tracking-wider border select-none',
        styles,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', dotColor)} />
      <span>{norm}</span>
    </span>
  );
}

export default PriorityBadge;
