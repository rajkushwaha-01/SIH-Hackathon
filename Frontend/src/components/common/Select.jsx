import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Select = forwardRef(function Select(
  {
    label,
    options = [],
    error,
    helperText,
    className = '',
    containerClassName = '',
    placeholder,
    id,
    ...props
  },
  ref
) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={cn('w-full flex flex-col gap-1', containerClassName)}>
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold text-on-surface">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          ref={ref}
          className={cn(
            'w-full appearance-none bg-surface-container-lowest border rounded text-sm text-on-surface transition-all font-sans py-2 pl-3 pr-8',
            error
              ? 'border-error focus:border-error focus:ring-1 focus:ring-error'
              : 'border-outline-variant focus:border-primary-container focus:ring-2 focus:ring-primary-fixed',
            'disabled:bg-surface-container-low disabled:opacity-60 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const lbl = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={val} value={val}>
                {lbl}
              </option>
            );
          })}
        </select>
        <ChevronDown className="w-4 h-4 text-outline absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
      {error && <span className="text-xs font-medium text-error">{error}</span>}
      {!error && helperText && (
        <span className="text-xs text-on-surface-variant">{helperText}</span>
      )}
    </div>
  );
});

export default Select;
