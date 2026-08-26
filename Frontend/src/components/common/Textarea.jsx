import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    helperText,
    className = '',
    containerClassName = '',
    rows = 4,
    id,
    ...props
  },
  ref
) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={cn('w-full flex flex-col gap-1', containerClassName)}>
      {label && (
        <label htmlFor={textareaId} className="text-xs font-semibold text-on-surface">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        ref={ref}
        rows={rows}
        className={cn(
          'w-full bg-surface-container-lowest border rounded text-sm text-on-surface placeholder:text-outline/70 transition-all font-sans p-3 resize-y',
          error
            ? 'border-error focus:border-error focus:ring-1 focus:ring-error'
            : 'border-outline-variant focus:border-primary-container focus:ring-2 focus:ring-primary-fixed',
          'disabled:bg-surface-container-low disabled:opacity-60 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs font-medium text-error">{error}</span>}
      {!error && helperText && (
        <span className="text-xs text-on-surface-variant">{helperText}</span>
      )}
    </div>
  );
});

export default Textarea;
