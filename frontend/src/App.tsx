import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { GuestRoute } from './routes/GuestRoute';
import { ProfileProvider } from './contexts/ProfileContext';
import { ProfileGuard } from './routes/ProfileGuard';
import { OnboardingGuard } from './routes/OnboardingGuard';
import { AdminGuard } from './routes/AdminGuard';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { GoogleCallbackPage } from './pages/auth/GoogleCallbackPage';
import { AppShell } from './pages/app/AppShell';
import { AdminShell } from './pages/admin/AdminShell';
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminUserDetails } from './pages/admin/AdminUserDetails';
import { AdminAnalyses } from './pages/admin/AdminAnalyses';
import { AdminAnalysisDetails } from './pages/admin/AdminAnalysisDetails';
import { AdminDataset } from './pages/admin/AdminDataset';
import { AdminMLStatus } from './pages/admin/AdminMLStatus';
import { AdminHealth } from './pages/admin/AdminHealth';
import { AdminLogs } from './pages/admin/AdminLogs';
import { AdminSettings } from './pages/admin/AdminSettings';
import { OnboardingPage } from './pages/onboarding/OnboardingPage';
import { BackgroundManager } from './components/background';
import { CursorFollow } from './components/motion';

import { Doodle } from './components/illustrations/Doodle';

function AppContent() {
  const location = useLocation();
  
  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden opacity-[0.03]">
        <Doodle type="circle" className="absolute top-[10%] left-[5%] w-32 h-32 text-[#26384B]" />
        <Doodle type="leaf" className="absolute bottom-[20%] right-[10%] w-48 h-48 text-[#26384B]" />
        <Doodle type="swirl" className="absolute top-[40%] right-[5%] w-24 h-24 text-[#26384B]" />
        <Doodle type="blob" className="absolute bottom-[10%] left-[15%] w-64 h-64 text-[#26384B]" />
        <Doodle type="face" className="absolute top-[5%] right-[25%] w-20 h-20 text-[#26384B]" />
      </div>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public Route */}
          <Route path="/" element={<HomePage />} />
        
        {/* Guest Only Routes */}
        <Route 
          path="/login" 
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <GuestRoute>
              <SignupPage />
            </GuestRoute>
          } 
        />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
        <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
        
        {/* Protected Routes */}
        <Route 
          path="/onboarding" 
          element={
            <ProtectedRoute>
              <OnboardingGuard>
                <OnboardingPage />
              </OnboardingGuard>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/app/*" 
          element={
            <ProtectedRoute>
              <ProfileGuard>
                <AppShell />
              </ProfileGuard>
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Portal */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminGuard>
                <AdminShell />
              </AdminGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:userId" element={<AdminUserDetails />} />
          <Route path="analyses" element={<AdminAnalyses />} />
          <Route path="analyses/:analysisId" element={<AdminAnalysisDetails />} />
          <Route path="dataset" element={<AdminDataset />} />
          <Route path="models" element={<AdminMLStatus />} />
          <Route path="health" element={<AdminHealth />} />
          <Route path="logs" element={<AdminLogs />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </AnimatePresence>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <BrowserRouter>
          <BackgroundManager>
            <CursorFollow />
            <AppContent />
          </BackgroundManager>
        </BrowserRouter>
      </ProfileProvider>
    </AuthProvider>
  );
}

export default App;
