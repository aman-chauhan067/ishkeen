import React, { useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../lib/api';
import { AppDashboard } from './AppDashboard';
import { UploadPage } from './UploadPage';
import { HistoryPage } from './HistoryPage';
import { ResultsPage } from './ResultsPage';
import { RoutineSelectionPage } from './RoutineSelectionPage';
import { SettingsPage } from './SettingsPage';
import { PageTransition } from '../../components/motion';
import { AmbientGlow } from '../../components/motion/AmbientGlow';
import { ProfileDrawer } from '../../components/ui/ProfileDrawer';
import { Doodle } from '../../components/illustrations/Doodle';
import { DragonflyLogo } from '../../components/ui/DragonflyLogo';

const NavItem = ({ to, children, end = false }: { to: string, children: React.ReactNode, end?: boolean }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `group relative flex items-center justify-center px-4 py-2 text-sm font-bold tracking-widest uppercase transition-colors duration-[600ms] ease-[var(--luxury-ease)] focus:outline-none ${
        isActive ? 'text-[#26384B]' : 'text-[#4C6072] hover:text-[#26384B]'
      }`
    }
  >
    {({ isActive }) => (
      <>
        <span className="relative z-10">{children}</span>
        <AmbientGlow
          trigger={isActive ? 'always' : 'group-hover'}
          blur="blur-[40px]"
          opacity={isActive ? 'opacity-[0.15]' : 'opacity-0 group-hover:opacity-[0.12]'}
          className="rounded-[ellipse]"
        />
      </>
    )}
  </NavLink>
);

export const AppShell: React.FC = () => {
  const { user } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const initial = user?.email?.charAt(0).toUpperCase() || '?';
  const [resendStatus, setResendStatus] = useState<'idle' | 'sent' | 'error'>('idle');


  const handleResend = async () => {
    if (user?.email) {
      try {
        await api.post('/auth/resend-verification', { email: user.email });
        setResendStatus('sent');
        setTimeout(() => setResendStatus('idle'), 5000);
      } catch {
        setResendStatus('error');
        setTimeout(() => setResendStatus('idle'), 5000);
      }
    }
  };

  return (
    <PageTransition className="min-h-screen flex flex-col relative z-10">
      {!user?.is_email_verified && (
        <div className="bg-amber-50 border-b border-amber-200 py-2.5 px-4 text-center z-50 relative">
          <p className="text-amber-800 text-sm font-medium flex items-center justify-center gap-2">
            {resendStatus === 'sent' ? (
              <span className="text-emerald-700">Verification email sent! Check your inbox.</span>
            ) : resendStatus === 'error' ? (
              <span className="text-red-600">Failed to send. <button onClick={handleResend} className="underline font-bold">Try again</button></span>
            ) : (
              <>
                Verify your email to unlock all features.
                <button onClick={handleResend} className="ml-2 underline font-bold hover:text-amber-900">Resend Link</button>
              </>
            )}
          </p>
        </div>
      )}
      {/* Global Background Doodles */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden opacity-5">
        <Doodle type="circle" className="absolute top-[10%] left-[5%] w-32 h-32 text-[#4C6072]" />
        <Doodle type="leaf" className="absolute bottom-[20%] right-[10%] w-48 h-48 text-[#4C6072]" />
        <Doodle type="swirl" className="absolute top-[40%] right-[5%] w-24 h-24 text-[#4C6072]" />
        <Doodle type="blob" className="absolute bottom-[10%] left-[15%] w-64 h-64 text-[#4C6072]" />
      </div>

      {/* Floating Header / Nav */}
      <header className="sticky top-6 z-40 mx-auto w-full max-w-7xl px-8 lg:px-12 mb-12" role="banner">
        <div className="flex justify-between items-center h-[96px] px-12 rounded-[48px] bg-white/60 backdrop-blur-[24px] border border-white/20 shadow-[0_30px_80px_rgba(37,58,74,0.06)]">
          {/* Brand */}
          <div className="flex-shrink-0">
            <NavLink
              to="/app"
              end
              className="focus:outline-none"
              aria-label="Ishkeen home"
            >
              <DragonflyLogo size="sm" showSubtitle={false} />
            </NavLink>
          </div>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-12 absolute left-1/2 -translate-x-1/2" aria-label="Main navigation">
            <NavItem to="/app" end>Dashboard</NavItem>
            <NavItem to="/app/upload">Analysis</NavItem>
            <NavItem to="/app/history">History</NavItem>
          </nav>

          {/* User / Logout */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-white/40 border border-white/40 shadow-sm transition-all duration-[600ms] ease-[var(--luxury-ease)] hover:bg-white/60 focus:outline-none overflow-hidden"
              aria-label="Open profile"
            >
              <AmbientGlow trigger="group-hover" blur="blur-[30px]" opacity="opacity-[0.1]" />
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover relative z-10" />
              ) : (
                <span className="text-[#26384B] font-editorial text-xl leading-none pt-[2px] relative z-10">{initial}</span>
              )}
            </button>
          </div>
        </div>
      </header>
      
      <ProfileDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />



      {/* Page content */}
      <main className="flex-1 w-full" id="main-content">
        <Routes>
          <Route index element={<AppDashboard />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="results/:analysisId" element={<ResultsPage />} />
          <Route path="routine-selection/:id" element={<RoutineSelectionPage />} />
        </Routes>
      </main>
    </PageTransition>
  );
};
