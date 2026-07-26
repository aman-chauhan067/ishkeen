import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#F6F4EF] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#26384B]/20 border-t-[#26384B] rounded-full animate-spin" />
      </div>
    );
  }

  // Double check admin role
  if (!user || user.role !== 'admin') {
    return <Navigate to="/app/dashboard" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
