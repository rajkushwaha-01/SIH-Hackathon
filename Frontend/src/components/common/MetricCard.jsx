import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../utils/cn';

export function MetricCard({
  title,
  value,
  subtitle,
  trend = null,
  icon: Icon,
  variant = 'default',
  className = '',
  onClick,
}) {
  const isHighlight = variant === 'highlight' || variant === 'ai';
  const isCritical = variant === 'critical';
  const isWarning = variant === 'warning';

  let containerBg = 'bg-surface-container-lowest border-outline-variant text-on-surface';
  let titleColor = 'text-on-surface-variant';
  let valueColor = 'text-on-surface';

  if (isHighlight) {
    containerBg = 'bg-primary text-white border-primary ai-shimmer';
    titleColor = 'text-white/90';
    valueColor = 'text-white';
  } else if (isCritical) {
    containerBg = 'bg-error-container/20 border-error/40 text-on-surface';
    titleColor = 'text-error font-semibold';
    valueColor = 'text-error';
  } else if (isWarning) {
    containerBg = 'bg-amber-50/50 border-amber-300 text-on-surface';
    titleColor = 'text-amber-900 font-semibold';
    valueColor = 'text-amber-900';
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-lg p-5 border shadow-subtle flex flex-col justify-between transition-all duration-150 relative overflow-hidden',
        onClick && 'cursor-pointer hover:shadow-card hover:-translate-y-0.5',
        containerBg,
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={cn('text-xs font-semibold uppercase tracking-wider', titleColor)}>
          {title}
        </span>
        {Icon && (
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center',
              isHighlight ? 'bg-white/20 text-white' : 'bg-surface-container-low text-primary'
            )}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 my-1">
        <span className={cn('text-3xl lg:text-4xl font-bold tracking-tight tnum', valueColor)}>
          {value}
        </span>

        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded',
              isHighlight
                ? 'bg-white/25 text-white'
                : trend.direction === 'up' && trend.isPositive === false
                ? 'bg-error-container text-error'
                : trend.direction === 'up' && trend.isPositive === true
                ? 'bg-green-100 text-safety-green'
                : 'bg-surface-container-high text-on-surface-variant'
            )}
          >
            {trend.direction === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend.direction === 'down' && <TrendingDown className="w-3 h-3" />}
            {trend.direction === 'neutral' && <Minus className="w-3 h-3" />}
            <span>{trend.value}</span>
          </span>
        )}
      </div>

      {subtitle && (
        <p
          className={cn(
            'text-xs mt-1 truncate',
            isHighlight ? 'text-white/80' : 'text-on-surface-variant'
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default MetricCard;
