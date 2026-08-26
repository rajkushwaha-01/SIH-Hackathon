import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  MapPin,
  Menu,
  ShieldCheck,
  User,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export default function Topbar({ onToggleSidebar, user = null, onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/similar-incidents?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const currentUser = user || {
    name: 'Lead HSE Officer',
    email: 'hse.officer@safety.org',
    role: 'HSE_OFFICER',
    site: 'All Enterprise Sites',
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface border-b border-outline-variant flex items-center justify-between px-4 md:px-8 shadow-subtle">
      {/* Left: Mobile Menu & Mobile Brand */}
      <div className="flex items-center gap-3 md:hidden">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-base font-bold text-primary">Safety Intelligence</span>
      </div>

      {/* Center: Global Search Bar matching Stitch */}
      <div className="hidden md:flex items-center flex-1 max-w-lg">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search safety data, incidents, precursors, or sites (Enter to search)..."
            className="w-full bg-surface-container-low border border-outline-variant rounded-full py-2 pl-10 pr-4 text-sm font-sans placeholder:text-outline text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-fixed transition-all"
          />
        </form>
      </div>

      {/* Right: Actions & User Info */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Site Scope Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low border border-outline-variant text-xs font-medium text-on-surface-variant">
          <MapPin className="w-3.5 h-3.5 text-primary-container" />
          <span>{currentUser.site || 'Global Enterprise'}</span>
        </div>

        {/* HSE Alerts Bell */}
        <button
          onClick={() => navigate('/alerts')}
          className="relative p-2 rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors"
          title="View HSE Alerts"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error ring-2 ring-surface"></span>
        </button>

        {/* User Profile / Status */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-full md:rounded-lg hover:bg-surface-container-low transition-colors border border-transparent md:border-outline-variant/60"
          >
            <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-xs border border-primary-fixed-dim">
              {currentUser.name ? currentUser.name.charAt(0) : 'H'}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-on-surface leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[10px] font-mono text-primary font-medium">
                {currentUser.role}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-outline hidden md:block" />
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div
              onMouseLeave={() => setShowUserMenu(false)}
              className="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-elevated py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div className="px-4 py-2 border-b border-outline-variant/60">
                <p className="text-xs font-bold text-on-surface">{currentUser.name}</p>
                <p className="text-[11px] text-on-surface-variant truncate">{currentUser.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  navigate('/settings');
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-on-surface hover:bg-surface-container-low transition-colors"
              >
                <User className="w-4 h-4 text-outline" />
                <span>Account & HSE Preferences</span>
              </button>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  navigate('/audit');
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-on-surface hover:bg-surface-container-low transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-outline" />
                <span>System Security & Audit</span>
              </button>
              <div className="border-t border-outline-variant/60 my-1"></div>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  if (onLogout) onLogout();
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-error hover:bg-error-container/20 transition-colors font-medium"
              >
                <LogOut className="w-4 h-4 text-error" />
                <span>Sign Out / Switch Profile</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
