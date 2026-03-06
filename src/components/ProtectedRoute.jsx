
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

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect each role to their own home, never back to login
    if (user.role === 'super_admin') return <Navigate to="/crm/admin/dashboard" replace />;
    if (user.role === 'sub_admin') return <Navigate to="/crm/admin/dashboard" replace />;
    if (user.role === 'manager') return <Navigate to="/crm/admin/dashboard" replace />;
    if (user.role === 'hr_manager') return <Navigate to="/crm/hr/dashboard" replace />;
    if (user.role === 'sales_executive') return <Navigate to="/crm/sales/crm" replace />;
    if (user.role === 'telecaller') return <Navigate to="/crm/sales/crm" replace />;

    return <Navigate to="/crm/login" replace />;
  }

  // Additional check using permission utility if needed
  if (!canAccessPage(user.role, location.pathname)) {
     // Fallback redirects — send each role to their own home, never back to login
     if (user.role === 'super_admin') return <Navigate to="/crm/admin/dashboard" replace />;
     if (user.role === 'sub_admin') return <Navigate to="/crm/admin/dashboard" replace />;
     if (user.role === 'manager') return <Navigate to="/crm/admin/dashboard" replace />;
     if (user.role === 'hr_manager') return <Navigate to="/crm/hr/dashboard" replace />;
     if (user.role === 'sales_executive') return <Navigate to="/crm/sales/crm" replace />;
     if (user.role === 'telecaller') return <Navigate to="/crm/sales/crm" replace />;
     return <Navigate to="/crm/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
