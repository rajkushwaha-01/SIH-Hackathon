import React from 'react';
import { AlertOctagon, HelpCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export function SIFStatusBadge({ status = 'NEEDS_REVIEW', confidence = null, size = 'sm', className = '' }) {
  const norm = String(status).toUpperCase();

  let style = 'bg-surface-container-high text-on-surface-variant border-outline-variant';
  let Icon = HelpCircle;
  let text = 'Needs Review';

  if (norm.includes('SIF_POTENTIAL') || norm === 'SIF' || norm === 'SIF_CAPABLE' || norm === 'YES') {
    style = 'bg-error text-white font-bold border-error shadow-xs';
    Icon = AlertOctagon;
    text = 'SIF Potential';
  } else if (norm.includes('NON') || norm === 'NO') {
    style = 'bg-surface-container-high text-on-surface-variant font-medium border-outline-variant';
    Icon = CheckCircle2;
    text = 'Non-SIF';
  } else if (norm.includes('REVIEW') || norm === 'UNCERTAIN') {
    style = 'bg-amber-100 text-amber-900 font-semibold border-amber-300';
    Icon = HelpCircle;
    text = 'Needs Review';
  }

  const sizeClasses = size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : size === 'lg' ? 'px-3 py-1 text-sm font-bold' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded font-sans tracking-wide border uppercase select-none',
        style,
        sizeClasses,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{text}</span>
      {confidence !== null && confidence !== undefined && (
        <span className="font-mono text-[10px] opacity-85 pl-1 border-l border-current/20 font-normal">
          {Math.round(confidence * (confidence <= 1 ? 100 : 1))}% conf.
        </span>
      )}
    </span>
  );
}

export default SIFStatusBadge;
