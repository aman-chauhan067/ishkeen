import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Glass } from '../../components/ui/Glass';
import { BlurReveal, PageTransition, Fade } from '../../components/motion';
import { Typography } from '../../components/ui/Typography';


export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState(0);

  const calculateStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    setStrength(score);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setPassword(e.target.value);
    calculateStrength(e.target.value);
  };

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setStatus('error');
      setErrorMsg('Missing reset token.');
      return;
    }
    setStatus('loading');
    try {
      await api.post('/auth/reset-password', { token, password });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.data?.detail || 'Failed to reset password. The link might be expired.');
    }
  };

  if (!token) {
    return (
      <PageTransition className="min-h-screen flex items-center justify-center py-8 px-4 sm:px-6 relative z-10">
        <BlurReveal duration={0.8} className="w-full max-w-[460px]">
          <Glass variant="deep" className="py-10 px-8 sm:px-10 rounded-[32px]">
            <div className="mb-7 relative">
              <Link to="/" className="inline-block mb-4 relative z-10">
                <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#4C6072]">ISHKEEN</span>
              </Link>
              <h1 className="app-heading-2 text-[#26384B] font-black leading-tight relative z-10">
                Set New Password.
              </h1>
            </div>
            <div className="space-y-5">
              <Alert variant="error" message="Invalid reset link. Please request a new password reset." />
              <Button
                variant="primary"
                className="w-full rounded-full"
                onClick={() => navigate('/login')}
              >
                Go to Login
              </Button>
            </div>
          </Glass>
        </BlurReveal>
      </PageTransition>
    );
  }

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
              Set New Password.
            </h1>
          </div>

          {status === 'success' ? (
            <Fade className="space-y-5">
              <Alert variant="success" message="Your password has been successfully reset!" />
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
              {status === 'error' && (
                <Fade>
                  <Alert variant="error" message={errorMsg} />
                </Fade>
              )}

              <div>
                <Input
                  label="New Password"
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={handlePasswordChange}
                />
                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1 h-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-full ${i <= strength ? (strength <= 2 ? 'bg-red-400' : strength <= 4 ? 'bg-amber-400' : 'bg-emerald-500') : 'bg-gray-200'}`}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-[#4C6072] uppercase tracking-wider text-right">
                      {strength <= 2 ? 'Weak' : strength <= 4 ? 'Good' : 'Strong'}
                    </p>
                  </div>
                )}
                <Typography variant="caption" className="mt-2 block">
                  Must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character.
                </Typography>
              </div>

              <div className="pt-1">
                <Button
                  id="reset-password-submit-btn"
                  type="submit"
                  variant="primary"
                  className="w-full rounded-full"
                  isLoading={status === 'loading'}
                >
                  Reset Password
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
