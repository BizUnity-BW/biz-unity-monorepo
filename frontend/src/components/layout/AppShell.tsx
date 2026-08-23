import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    // data-print-expand: the shell is a fixed-height flex box with a scrolling main,
    // which would clip a printout to one page. See the @media print block in index.css.
    <div data-print-expand className="flex h-screen bg-[var(--color-bg)]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div data-print-expand className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main
          data-print-expand
          className="flex-1 overflow-auto p-4 text-[var(--color-text)] sm:p-6"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
