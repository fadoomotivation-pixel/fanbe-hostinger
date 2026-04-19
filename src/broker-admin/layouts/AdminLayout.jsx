import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { ADMIN_ROUTES } from '../lib/constants';

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex">
        <aside className="sticky top-0 h-screen w-72 shrink-0 bg-slate-950 text-slate-200">
          <div className="border-b border-slate-800 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Fanbe Group</p>
            <h1 className="mt-1 text-lg font-semibold">Broker Payout Admin</h1>
          </div>
          <nav className="space-y-1 p-3">
            {ADMIN_ROUTES.map((item) => {
              const Icon = Icons[item.icon] || Icons.Circle;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/broker/admin'}
                  className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  <Icon className="h-4 w-4" /> {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
