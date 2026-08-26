import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  AlertTriangle,
  GitFork,
  SlidersHorizontal,
  Search,
  Boxes,
  BellRing,
  Bot,
  BarChart3,
  History,
  Settings,
  Shield,
  Upload,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const NAV_ITEMS = [
  { name: 'Overview', path: '/', icon: LayoutDashboard },
  { name: 'Safety Reports', path: '/reports', icon: FileText },
  { name: 'SIF Intelligence', path: '/intelligence', icon: AlertTriangle },
  { name: 'Precursor Graph', path: '/precursor-graph', icon: GitFork, badge: 'WOW' },
  { name: 'Risk Simulator', path: '/risk-simulator', icon: SlidersHorizontal, badge: 'WOW' },
  { name: 'Incident Search', path: '/similar-incidents', icon: Search },
  { name: 'Patterns', path: '/patterns', icon: Boxes },
  { name: 'HSE Alerts', path: '/alerts', icon: BellRing },
  { name: 'HSE Copilot', path: '/copilot', icon: Bot, badge: 'AI' },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Audit Trail', path: '/audit', icon: History },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-64 bg-surface-container-low border-r border-outline-variant flex flex-col py-6 px-4 z-50 transition-transform duration-200 ease-in-out md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary shadow-subtle">
            <Shield className="w-6 h-6 fill-current text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-primary tracking-tight leading-tight">
              Safety Intelligence
            </h1>
            <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              SIF PRECURSOR ENGINE
            </p>
          </div>
        </div>

        {/* Quick Upload CTA */}
        <div className="mb-4 px-1">
          <NavLink
            to="/reports/upload"
            onClick={() => onClose && onClose()}
            className={({ isActive }) =>
              cn(
                'w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-semibold transition-all shadow-sm',
                isActive
                  ? 'bg-primary text-white ring-2 ring-primary-container'
                  : 'bg-primary-container text-white hover:bg-primary-container/90'
              )
            }
          >
            <Upload className="w-4 h-4" />
            <span>Ingest Safety Report</span>
          </NavLink>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto pr-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose && onClose()}
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-primary-container text-white shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-colors',
                      isActive ? 'text-white' : 'text-on-surface-variant group-hover:text-primary'
                    )}
                  />
                  <span>{item.name}</span>
                </div>

                {item.badge && (
                  <span
                    className={cn(
                      'text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded',
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badge === 'AI'
                        ? 'bg-primary-fixed-dim text-primary'
                        : 'bg-amber-100 text-amber-800'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info matching Stitch */}
        <div className="pt-4 mt-auto border-t border-outline-variant/60 px-2">
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span>SIH 2026 • PS 26165</span>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-surface-container-high px-1.5 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              LIVE
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
