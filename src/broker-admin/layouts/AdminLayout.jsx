import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { ADMIN_ROUTES } from '../lib/constants';
import { supabase } from '@/lib/supabase';

const AdminLayout = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/broker/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-slate-950 text-slate-200 transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:translate-x-0`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
            <Icons.Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Fanbe Group</p>
            <p className="text-sm font-bold text-white">Payout Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {ADMIN_ROUTES.map((item) => {
            const Icon = Icons[item.icon] || Icons.Circle;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/broker/admin'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-slate-800 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-red-400"
          >
            <Icons.LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 shadow-sm">
          {/* Mobile hamburger */}
          <button
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Icons.Menu className="h-5 w-5" />
          </button>

          {/* Breadcrumb / page title area */}
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-700">Broker Payout Admin Panel</p>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <a
              href="/broker/payout"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <Icons.ExternalLink className="h-3.5 w-3.5" />
              Broker Portal
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
            >
              <Icons.LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="min-w-0 flex-1 overflow-auto p-6">
          <Outlet />
        </main>

        {/* Admin panel footer */}
        <footer className="border-t border-slate-200 bg-white px-6 py-3">
          <p className="text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Fanbe Group · Broker Payout Admin ·
            <a href="/" className="ml-1 hover:text-slate-600">Main Website</a>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;
