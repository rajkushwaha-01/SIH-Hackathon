import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, FileSearch } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';

export default function NotFoundPage() {
  return (
    <PageContainer className="flex items-center justify-center min-h-[70vh]">
      <div className="max-w-md text-center bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-elevated">
        <div className="w-16 h-16 rounded-full bg-error-container/40 text-error flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-outline">
          HTTP 404 — Safety Perimeter
        </span>
        <h1 className="text-2xl font-bold text-on-surface mt-1 mb-2">Page Not Found</h1>
        <p className="text-sm text-on-surface-variant mb-6">
          The requested safety intelligence route does not exist or has been moved within the enterprise taxonomy.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Return to Overview</span>
          </Link>
          <Link
            to="/reports"
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-surface-container-low border border-outline-variant text-on-surface text-sm font-medium hover:bg-surface-container-high transition-colors"
          >
            <FileSearch className="w-4 h-4" />
            <span>Safety Reports</span>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
