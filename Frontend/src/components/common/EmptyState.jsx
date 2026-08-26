import React from 'react';
import { FolderSearch, Plus } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export function EmptyState({
  title = 'No records found',
  description = 'There are no safety intelligence records matching your active filter criteria.',
  icon: Icon = FolderSearch,
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center bg-surface-container-lowest border border-outline-variant rounded-lg shadow-xs',
        className
      )}
    >
      <div className="w-14 h-14 rounded-full bg-surface-container-low border border-outline-variant/60 flex items-center justify-center text-outline mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-on-surface mb-1">{title}</h3>
      <p className="text-xs text-on-surface-variant max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="md" icon={Plus} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
