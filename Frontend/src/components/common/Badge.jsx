import React from 'react';
import { cn } from '../../utils/cn';

const VARIANTS = {
  default: 'bg-surface-container-high text-on-surface border-outline-variant/60',
  primary: 'bg-primary-fixed-dim text-primary-on-fixed font-semibold border-primary-fixed',
  accent: 'bg-primary-container text-white border-primary-container',
  error: 'bg-error-container text-error font-semibold border-error/20',
  success: 'bg-green-100 text-green-800 font-semibold border-green-200',
  warning: 'bg-amber-100 text-amber-900 font-semibold border-amber-200',
  outline: 'bg-transparent text-on-surface-variant border-outline-variant',
};

const SIZES = {
  xs: 'px-1.5 py-0.5 text-[10px]',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
  dot = false,
  dotColor,
  icon: Icon,
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-sans rounded border font-medium uppercase tracking-wider select-none',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full', dotColor || 'bg-current')}
        />
      )}
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{children}</span>
    </span>
  );
}

export default Badge;
