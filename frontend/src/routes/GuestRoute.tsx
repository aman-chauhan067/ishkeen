import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status } = useAuth();

  if (status === 'loading') {
    return <div className="min-h-screen bg-skin-light flex items-center justify-center">Loading...</div>;
  }

  if (status === 'authenticated') {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
};
