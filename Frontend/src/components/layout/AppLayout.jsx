import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col antialiased">
      {/* Fixed Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Workspace Container */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Sticky Topbar */}
        <Topbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          user={user}
          onLogout={onLogout}
        />

        {/* Dynamic Route Canvas */}
        <main className="flex-1 overflow-x-hidden flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
