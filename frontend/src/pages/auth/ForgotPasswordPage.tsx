import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Glass } from '../../components/ui/Glass';
import { BlurReveal, PageTransition, Fade } from '../../components/motion';


export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await api.post('/auth/forgot-password', { email });
    } catch {
      // Always show success to prevent email enumeration
    } finally {
      setStatus('success');
    }
  };

  return (
    <PageTransition className="min-h-screen flex items-center justify-center py-8 px-4 sm:px-6 relative z-10">
      <BlurReveal duration={0.8} className="w-full max-w-[460px]">
        <Glass variant="deep" className="py-10 px-8 sm:px-10 rounded-[32px]">
          {/* In-card header */}
          <div className="mb-7 relative">
            <Link to="/" className="inline-block mb-4 relative z-10">
              <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#4C6072]">ISHKEEN</span>
            </Link>
            <h1 className="app-heading-2 text-[#26384B] font-black leading-tight relative z-10">
              Reset Password.
            </h1>
          </div>

          {status === 'success' ? (
            <Fade className="space-y-5">
              <Alert variant="success" message="Password reset email sent." />
              <Button
                variant="primary"
                className="w-full rounded-full"
                onClick={() => navigate('/login')}
              >
                Return to Login
              </Button>
            </Fade>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-[#4C6072] text-sm">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <Input
                label="Email address"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="pt-1">
                <Button
                  id="forgot-password-submit-btn"
                  type="submit"
                  variant="primary"
                  className="w-full rounded-full"
                  isLoading={status === 'loading'}
                >
                  Send Reset Link
                </Button>
              </div>
            </form>
          )}

          <div className="mt-5 text-center">
            <Link
              to="/login"
              className="text-[10px] font-bold text-[#4C6072] hover:text-[#26384B] tracking-widest uppercase transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </Glass>
      </BlurReveal>
    </PageTransition>
  );
};
