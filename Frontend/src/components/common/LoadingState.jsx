import React from 'react';
import { Loader2, Shield } from 'lucide-react';
import { cn } from '../../utils/cn';

export function LoadingState({
  message = 'Loading safety intelligence...',
  subtext = 'Querying enterprise vector indexes and model telemetry...',
  fullscreen = false,
  className = '',
}) {
  const content = (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <div className="relative mb-4">
        <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
          <Shield className="w-6 h-6 animate-pulse" />
        </div>
        <Loader2 className="w-14 h-14 text-primary animate-spin absolute -top-1 -left-1 opacity-60" />
      </div>
      <h4 className="text-sm font-bold text-on-surface mb-1">{message}</h4>
      {subtext && <p className="text-xs text-on-surface-variant max-w-sm">{subtext}</p>}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-surface/80 backdrop-blur-xs z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

export default LoadingState;
