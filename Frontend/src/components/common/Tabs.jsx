import React from 'react';
import { cn } from '../../utils/cn';

export function Tabs({
  tabs = [],
  activeTab,
  onChange,
  className = '',
  variant = 'underline',
}) {
  if (variant === 'segmented') {
    return (
      <div
        className={cn(
          'inline-flex p-1 bg-surface-container-low border border-outline-variant rounded-md gap-1',
          className
        )}
      >
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-all select-none',
                isSelected
                  ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px]',
                    isSelected ? 'bg-primary-fixed text-primary' : 'bg-surface-container-high'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('border-b border-outline-variant flex gap-6', className)}>
      {tabs.map((tab) => {
        const isSelected = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 py-3 border-b-2 text-sm font-semibold transition-all -mb-[1px] select-none',
              isSelected
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant'
            )}
          >
            {Icon && <Icon className="w-4 h-4" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-mono font-medium',
                  isSelected ? 'bg-primary-fixed-dim text-primary' : 'bg-surface-container-high text-on-surface-variant'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
