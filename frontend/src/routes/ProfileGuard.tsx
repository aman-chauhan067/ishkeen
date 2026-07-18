import React from 'react';
import { Navigate } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext';
import { useAuth } from '../auth/AuthContext';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';

export const ProfileGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status, refreshProfile } = useProfile();
  const { user } = useAuth();

  if (status === 'loading') {
    return <div className="min-h-screen bg-skin-base flex items-center justify-center font-light">Loading profile...</div>;
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-skin-base flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-skin-light p-8 rounded-lg shadow-sm border border-skin-dark text-center space-y-6">
          <h2 className="text-2xl font-light text-gray-800">Connection Error</h2>
          <Alert variant="error" message="Unable to reach the server. Please check your connection and try again." />
          <Button onClick={() => refreshProfile()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (status === 'missing') {
    if (user && !user.is_email_verified) {
      return <>{children}</>;
    }
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
