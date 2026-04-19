import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAsyncData } from '../hooks/useAsyncData';
import { adminApi } from '../services/adminApi';
import { LoadingState } from './StateViews';

const ADMIN_ROLES = ['admin', 'super_admin', 'finance_admin', 'broker_admin'];

const AdminAuthGuard = ({ children }) => {
  const { data: session, loading } = useAsyncData(() => adminApi.getSession(), []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="p-6"><LoadingState label="Validating admin session..." /></div>
      </div>
    );
  }

  if (!session?.user) return <Navigate to="/broker/login" replace />;

  // Check app_metadata first (server-set, more secure), then user_metadata
  const role = session.user?.app_metadata?.role || session.user?.user_metadata?.role;

  if (!role || !ADMIN_ROLES.includes(role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-8 text-amber-900 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <h2 className="text-lg font-bold">Admin access required</h2>
          </div>
          <p className="text-sm leading-relaxed">
            Your account does not have admin privileges.<br />
            Ask a super admin to set your <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">app_metadata.role</code> to one of:<br />
            <span className="mt-1 block font-semibold">{ADMIN_ROLES.join(', ')}</span>
          </p>
          <a
            href="/broker/login"
            className="mt-5 block rounded-lg bg-amber-800 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-amber-900"
          >
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminAuthGuard;
