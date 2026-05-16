import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAsyncData } from '../hooks/useAsyncData';
import { adminApi } from '../services/adminApi';
import { LoadingState } from './StateViews';

const ADMIN_ROLES = ['admin', 'super_admin', 'finance_admin', 'broker_admin'];

const AdminAuthGuard = ({ children }) => {
  const { data: session, loading } = useAsyncData(() => adminApi.getSession(), []);

  if (loading) return <div className="p-6"><LoadingState label="Validating admin session..." /></div>;
  if (!session?.user) return <Navigate to="/broker/login" replace />;

  const role = session.user?.user_metadata?.role || session.user?.app_metadata?.role;
  if (role && !ADMIN_ROLES.includes(role)) {
    return (
      <div className="mx-auto mt-20 max-w-lg rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <h2 className="text-lg font-semibold">Admin access required</h2>
        <p className="mt-2 text-sm">Logged-in user does not have admin claim. Update user metadata role to one of: {ADMIN_ROLES.join(', ')}.</p>
      </div>
    );
  }

  return children;
};

export default AdminAuthGuard;
