import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#FCFBF8] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#253A4A]/20 border-t-[#253A4A] rounded-full animate-spin" />
      </div>
    );
  }

  // Double check admin role
  if (!user || user.role !== 'admin') {
    return <Navigate to="/app/dashboard" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
