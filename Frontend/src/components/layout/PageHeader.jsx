import React from 'react';
import Breadcrumbs from './Breadcrumbs';

export default function PageHeader({
  title,
  description,
  badge,
  actions,
  showBreadcrumbs = true,
}) {
  return (
    <div className="mb-6 pb-4 border-b border-outline-variant/60">
      {showBreadcrumbs && <Breadcrumbs />}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight">
              {title}
            </h1>
            {badge && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-fixed-dim text-primary">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-1 text-sm md:text-base text-on-surface-variant max-w-3xl">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
