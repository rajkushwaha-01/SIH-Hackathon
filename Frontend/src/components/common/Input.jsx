import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon: Icon,
    className = '',
    containerClassName = '',
    id,
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={cn('w-full flex flex-col gap-1', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-on-surface">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 pointer-events-none text-outline">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'w-full bg-surface-container-lowest border rounded text-sm text-on-surface placeholder:text-outline/70 transition-all font-sans py-2',
            Icon ? 'pl-9 pr-3' : 'px-3',
            error
              ? 'border-error focus:border-error focus:ring-1 focus:ring-error'
              : 'border-outline-variant focus:border-primary-container focus:ring-2 focus:ring-primary-fixed',
            'disabled:bg-surface-container-low disabled:opacity-60 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
      </div>
      {error && <span className="text-xs font-medium text-error">{error}</span>}
      {!error && helperText && (
        <span className="text-xs text-on-surface-variant">{helperText}</span>
      )}
    </div>
  );
});

export default Input;
