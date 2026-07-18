import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Typography } from '../../components/ui/Typography';
import { Glass } from '../../components/ui/Glass';
import { api } from '../../lib/api';
import { PageTransition, BlurReveal, Fade } from '../../components/motion';

import { Doodle } from '../../components/illustrations/Doodle';

export const SignupPage: React.FC = () => {
  const [email, setEmail] = useState('');
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

  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const validatePassword = () => {
    if (password !== confirmPassword) {
      setPasswordError("Passwords don't match");
      return false;
    }
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validatePassword()) {
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/signup', { email, password });
      setSuccess(true);
    } catch (err: any) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("We couldn't create your account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition className="min-h-screen flex items-center justify-center py-8 px-4 sm:px-6 relative z-10">
      <BlurReveal duration={0.8} className="w-full max-w-[460px]">
        <Glass variant="deep" className="py-10 px-8 sm:px-10 rounded-[32px]">
          {/* In-card header */}
          <div className="mb-7 relative">
            <Link to="/" className="inline-block mb-4 relative z-10">
              <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#5C7E9A]">ISHKEEN</span>
            </Link>
            <h2 className="text-[#253A4A] leading-tight relative z-10" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', letterSpacing: '-0.04em', fontWeight: 900 }}>
              Begin your journey.
            </h2>
            <Doodle type="stars" className="absolute -top-4 right-0 w-12 h-12 text-[#5C7E9A] opacity-20 z-0" delay={0.4} />
          </div>

          {success ? (
            <Fade className="text-center space-y-4 py-4">
              <Alert variant="success" message="Account created! Verification email sent." />
              <Typography variant="body" className="text-sm text-[#5C7E9A]">
                Please check your inbox and click the verification link to activate your account.
              </Typography>
              <Button onClick={() => navigate('/login', { replace: true })} variant="outline" className="mt-4 w-full rounded-full">
                Go to Login
              </Button>
            </Fade>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <AnimateErrors error={error} passwordError={passwordError} />

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

              <div>
                <Input
                  label="Password"
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    handlePasswordChange(e);
                    if (passwordError) setPasswordError(null);
                  }}
                />
                {/* Inline password strength indicator */}
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
                    <p className="text-[10px] text-[#5C7E9A] uppercase tracking-wider text-right">
                      {strength <= 2 ? 'Weak' : strength <= 4 ? 'Good' : 'Strong'}
                    </p>
                  </div>
                )}
              </div>

              <Input
                label="Confirm Password"
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
              />

              <div className="pt-1">
                <Button
                  id="signup-submit-btn"
                  type="submit"
                  variant="primary"
                  className="w-full rounded-full"
                  isLoading={isLoading}
                >
                  Create Account
                </Button>
              </div>
            </form>
          )}

          {!success && (
            <>
              {/* Divider */}
              <div className="my-5 text-center text-[#5C7E9A] text-[10px] font-bold uppercase tracking-widest relative">
                <span className="bg-white px-3 relative z-10">Or continue with</span>
                <div className="absolute top-1/2 left-0 right-0 h-px bg-[#253A4A]/10" />
              </div>

              <Button
                variant="outline"
                type="button"
                className="w-full flex items-center justify-center gap-3 rounded-full"
                onClick={async () => {
                  try {
                    const response = await api.get<{url: string}>('/auth/google/url');
                    window.location.href = response.url;
                  } catch (err) {
                    setError('Failed to initialize Google Login. Please try again.');
                  }
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </Button>

              <div className="mt-5 text-center">
                <Typography variant="caption">
                  Already have an account?{' '}
                  <Link to="/login" className="text-[#253A4A] hover:text-[#5C7E9A] font-bold transition-colors ml-1">
                    SIGN IN
                  </Link>
                </Typography>
              </div>
            </>
          )}
        </Glass>
      </BlurReveal>
    </PageTransition>
  );
};

const AnimateErrors: React.FC<{ error: string | null; passwordError: string | null }> = ({ error, passwordError }) => {
  return (
    <>
      {error && (
        <Fade>
          <Alert variant="error" message={error} className="mb-4" />
        </Fade>
      )}
      {passwordError && (
        <Fade>
          <Alert variant="error" message={passwordError} className="mb-4" />
        </Fade>
      )}
    </>
  );
};
