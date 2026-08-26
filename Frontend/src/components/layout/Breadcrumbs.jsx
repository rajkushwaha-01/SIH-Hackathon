import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS = {
  reports: 'Safety Reports',
  upload: 'Ingest Report',
  analyzing: 'NLP Analysis Pipeline',
  intelligence: 'SIF Intelligence',
  'precursor-graph': 'SIF Precursor Graph',
  'risk-simulator': 'What-If Risk Simulator',
  'similar-incidents': 'Similar Incident Search',
  patterns: 'Recurring Patterns',
  alerts: 'HSE Alerts',
  copilot: 'HSE Safety Copilot',
  analytics: 'Safety Analytics',
  audit: 'Audit Trail',
  review: 'HSE Review Workspace',
  settings: 'Settings',
};

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center space-x-1.5 text-xs text-on-surface-variant mb-3">
      <Link
        to="/"
        className="flex items-center gap-1 hover:text-primary transition-colors text-outline"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Safety Intelligence</span>
      </Link>

      {pathnames.map((segment, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const label = ROUTE_LABELS[segment] || segment.toUpperCase();

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-3.5 h-3.5 text-outline-variant" />
            {isLast ? (
              <span className="font-semibold text-on-surface">{label}</span>
            ) : (
              <Link to={to} className="hover:text-primary transition-colors text-outline">
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
