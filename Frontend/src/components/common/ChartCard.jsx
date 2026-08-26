import React from 'react';
import { cn } from '../../utils/cn';

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  className = '',
  height = 'h-72',
}) {
  return (
    <div
      className={cn(
        'bg-surface-container-lowest border border-outline-variant rounded-lg p-5 shadow-subtle flex flex-col',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-outline-variant/40">
        <div>
          <h3 className="text-base font-bold text-on-surface tracking-tight leading-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-on-surface-variant mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      <div className={cn('w-full flex-1 relative', height)}>
        {children}
      </div>
    </div>
  );
}

export default ChartCard;
