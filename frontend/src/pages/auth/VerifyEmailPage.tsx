import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Glass } from '../../components/ui/Glass';
import { BlurReveal, PageTransition } from '../../components/motion';
import { Typography } from '../../components/ui/Typography';

import { Doodle } from '../../components/illustrations/Doodle';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    const verify = async () => {
      try {
        await api.post('/auth/verify-email', { token });
        setStatus('success');
      } catch (err) {
        setStatus('error');
      }
    };
    verify();
  }, [token]);

  return (
    <PageTransition className="min-h-screen flex items-center justify-center py-8 px-4 sm:px-6 relative z-10">
      <BlurReveal duration={0.8} className="w-full max-w-[460px]">
        <Glass variant="deep" className="py-10 px-8 sm:px-10 rounded-[32px]">
          {/* In-card header */}
          <div className="mb-7 relative">
            <Link to="/" className="inline-block mb-4 relative z-10">
              <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#4C6072]">ISHKEEN</span>
            </Link>
            <h2 className="text-[#26384B] leading-tight relative z-10" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', letterSpacing: '-0.04em', fontWeight: 900 }}>
              Email Verification
            </h2>
            <Doodle type="circle" className="absolute -top-4 right-0 w-12 h-12 text-[#4C6072] opacity-20 z-0" delay={0.4} />
          </div>

          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="animate-spin border-2 border-[#26384B]/20 border-t-[#26384B] rounded-full w-8 h-8" />
              <Typography variant="body" className="text-sm text-[#4C6072]">
                Verifying your email...
              </Typography>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-5">
              <Alert variant="success" message="Your email has been verified successfully!" />
              <Button
                id="verify-email-continue-btn"
                variant="primary"
                className="w-full rounded-full"
                onClick={() => navigate('/app')}
              >
                Continue to App
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-5">
              <Alert variant="error" message="Invalid or expired verification link." />
              <Button
                id="verify-email-login-btn"
                variant="primary"
                className="w-full rounded-full"
                onClick={() => navigate('/login')}
              >
                Go to Login
              </Button>
            </div>
          )}
        </Glass>
      </BlurReveal>
    </PageTransition>
  );
};
