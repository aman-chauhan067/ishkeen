import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../lib/api';
import type { User } from '../../auth/types';
import { PageTransition, BlurReveal, Fade } from '../../components/motion';
import { Glass } from '../../components/ui/Glass';
import { Alert } from '../../components/ui/Alert';

export const GoogleCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('Google authentication was cancelled or failed.');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (!code || !state) {
      setError('Invalid callback URL. Missing code or state.');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    const processGoogleLogin = async () => {
      try {
        const user = await api.post<User>('/auth/google/login', { 
          code, 
          state, 
          redirect_uri: window.location.origin + '/auth/google/callback' 
        });
        login(user);
        
        if (user.role === 'admin') {
          navigate('/admin', { replace: true });
        } else if (!user.name) {
          navigate('/onboarding', { replace: true });
        } else {
          navigate('/app', { replace: true });
        }
      } catch (err: any) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to authenticate with Google.');
        }
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    processGoogleLogin();
  }, [searchParams, navigate, login]);

  return (
    <PageTransition className="min-h-screen flex items-center justify-center py-8 px-4 sm:px-6 relative z-10">
      <BlurReveal duration={0.8} className="w-full max-w-[460px]">
        <Glass variant="deep" className="py-10 px-8 sm:px-10 rounded-[32px] text-center">
          <div className="mb-7">
            <h2 className="text-[#26384B] leading-tight font-black text-2xl mb-4">
              {error ? 'Authentication Failed' : 'Authenticating...'}
            </h2>
            {error ? (
              <Fade>
                <Alert variant="error" message={error} />
                <p className="mt-4 text-sm text-[#4C6072]">Redirecting back to login...</p>
              </Fade>
            ) : (
              <p className="text-[#4C6072]">Please wait while we complete your Google sign in.</p>
            )}
          </div>
        </Glass>
      </BlurReveal>
    </PageTransition>
  );
};
