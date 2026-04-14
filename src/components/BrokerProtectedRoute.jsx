import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isBrokerAuthenticated } from '@/lib/brokerPortal';

const BrokerProtectedRoute = ({ children }) => {
  const location = useLocation();

  if (!isBrokerAuthenticated()) {
    return <Navigate to="/broker/login" state={{ from: location }} replace />;
  }

  return children;
};

export default BrokerProtectedRoute;
