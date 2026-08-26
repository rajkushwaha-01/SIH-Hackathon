import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const VARIANTS = {
  primary:
    'bg-primary text-white hover:bg-primary/90 shadow-sm focus:ring-2 focus:ring-primary-fixed border border-primary',
  secondary:
    'bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container-low focus:ring-2 focus:ring-primary-fixed',
  accent:
    'bg-primary-container text-white hover:bg-primary-container/90 shadow-sm focus:ring-2 focus:ring-primary-fixed border border-primary-container',
  danger:
    'bg-error text-white hover:bg-error/90 shadow-sm focus:ring-2 focus:ring-error-container border border-error',
  outline:
    'bg-transparent border border-outline-variant text-on-surface hover:bg-surface-container-low focus:ring-2 focus:ring-primary-fixed',
  ghost:
    'bg-transparent text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
  success:
    'bg-safety-green text-white hover:bg-safety-green/90 shadow-sm focus:ring-2 focus:ring-green-300 border border-safety-green',
};

const SIZES = {
  xs: 'px-2 py-1 text-xs rounded',
  sm: 'px-3 py-1.5 text-xs font-medium rounded',
  md: 'px-4 py-2 text-sm font-semibold rounded',
  lg: 'px-5 py-2.5 text-base font-semibold rounded-md',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  type = 'button',
  onClick,
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center font-sans transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer select-none';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(baseClasses, VARIANTS[variant], SIZES[size], className)}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 mr-2 shrink-0" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 ml-2 shrink-0" />}
        </>
      )}
    </button>
  );
}

export default Button;
