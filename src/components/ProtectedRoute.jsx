import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { canAccessPage } from '@/lib/permissions';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/crm/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'super_admin') return <Navigate to="/crm/admin/dashboard" replace />;
    if (user.role === 'sales_manager') return <Navigate to="/crm/manager/dashboard" replace />;
    if (user.role === 'sales_executive') return <Navigate to="/crm/employee/dashboard" replace />;
    return <Navigate to="/crm/login" replace />;
  }

  if (!canAccessPage(user.role, location.pathname)) {
    if (user.role === 'sales_manager') return <Navigate to="/crm/manager/dashboard" replace />;
    if (user.role === 'sales_executive') return <Navigate to="/crm/employee/dashboard" replace />;
    return <Navigate to="/crm/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
