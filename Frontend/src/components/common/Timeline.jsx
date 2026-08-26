import React from 'react';
import { Clock, Bot, User, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

export function Timeline({ events = [], className = '' }) {
  if (!events || events.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-on-surface-variant bg-surface-container-low rounded border border-outline-variant/40">
        No timeline activity recorded yet.
      </div>
    );
  }

  return (
    <div className={cn('relative pl-4 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant', className)}>
      {events.map((evt, idx) => {
        const isAI = evt.type === 'AI' || evt.actor === 'AI_ENGINE' || evt.actor === 'SYSTEM';
        const isReview = evt.type === 'REVIEW' || evt.action?.includes('REVIEW');
        const timestamp = evt.timestamp ? new Date(evt.timestamp).toLocaleString() : 'Just now';

        let Icon = Clock;
        let iconBg = 'bg-surface-container-high text-on-surface-variant border-outline-variant';

        if (isAI) {
          Icon = Bot;
          iconBg = 'bg-primary-fixed-dim text-primary border-primary-fixed';
        } else if (isReview) {
          Icon = User;
          iconBg = 'bg-green-100 text-safety-green border-green-300';
        } else if (evt.severity === 'CRITICAL') {
          Icon = AlertTriangle;
          iconBg = 'bg-error-container text-error border-error/30';
        }

        return (
          <div key={idx} className="relative flex items-start gap-3 group">
            <div
              className={cn(
                'absolute -left-4 w-5 h-5 rounded-full flex items-center justify-center border shadow-xs z-10',
                iconBg
              )}
            >
              <Icon className="w-3 h-3" />
            </div>

            <div className="flex-1 bg-surface-container-lowest border border-outline-variant/80 rounded-md p-3 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-bold text-on-surface">
                  {evt.title || evt.action || 'Audit Event'}
                </span>
                <span className="text-[10px] font-mono text-on-surface-variant">
                  {timestamp}
                </span>
              </div>

              {evt.description && (
                <p className="text-xs text-on-surface-variant leading-relaxed mb-1.5">
                  {evt.description}
                </p>
              )}

              {evt.actor && (
                <div className="flex items-center gap-1.5 text-[10px] text-outline font-medium">
                  <span>Actor:</span>
                  <span className="font-mono text-on-surface font-semibold">{evt.actor}</span>
                  {evt.role && <span className="bg-surface-container-high px-1 rounded">({evt.role})</span>}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Timeline;
