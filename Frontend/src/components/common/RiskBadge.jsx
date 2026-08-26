import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { cn } from '../../utils/cn';

export function RiskBadge({ level = 'MEDIUM', score = null, size = 'sm', className = '' }) {
  const normalized = String(level).toUpperCase();

  let bg = 'bg-surface-container-high text-on-surface border-outline-variant';
  let Icon = AlertCircle;
  let label = 'Low Risk';

  if (normalized.includes('CRITICAL') || normalized === 'CRITICAL') {
    bg = 'bg-error text-white border-error shadow-xs';
    Icon = ShieldAlert;
    label = 'Critical Risk';
  } else if (normalized.includes('HIGH') || normalized === 'HIGH') {
    bg = 'bg-error-container text-error font-bold border-error/30';
    Icon = AlertTriangle;
    label = 'High Risk';
  } else if (normalized.includes('MEDIUM') || normalized.includes('MODERATE') || normalized === 'MEDIUM') {
    bg = 'bg-amber-100 text-amber-900 font-semibold border-amber-300';
    Icon = AlertCircle;
    label = 'Moderate Risk';
  } else if (normalized.includes('LOW') || normalized === 'LOW') {
    bg = 'bg-green-100 text-safety-green font-semibold border-green-300';
    Icon = CheckCircle;
    label = 'Low Risk';
  }

  const sizeClasses = size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : size === 'lg' ? 'px-3 py-1 text-sm font-bold' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded font-sans tracking-wide border uppercase',
        bg,
        sizeClasses,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
      {score !== null && score !== undefined && (
        <span className="font-mono font-bold opacity-90 pl-1 border-l border-current/20">
          {score}
        </span>
      )}
    </span>
  );
}

export default RiskBadge;
