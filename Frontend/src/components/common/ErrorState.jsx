import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export function ErrorState({
  title = 'Unable to load safety data',
  message = 'An error occurred while communicating with the HSE Safety Intelligence server.',
  onRetry,
  className = '',
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center bg-error-container/20 border border-error/30 rounded-lg shadow-xs',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center mb-3">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-on-surface mb-1">{title}</h3>
      <p className="text-xs text-on-surface-variant max-w-md mb-4 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={onRetry}>
          Retry Connection
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
