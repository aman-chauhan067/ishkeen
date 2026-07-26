import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Typography } from '../../components/ui/Typography';
import { Glass } from '../../components/ui/Glass';
import { api } from '../../lib/api';
import type { User } from '../../auth/types';
import { PageTransition, BlurReveal, Fade } from '../../components/motion';

import { Doodle } from '../../components/illustrations/Doodle';
import { DragonflyLogo } from '../../components/ui/DragonflyLogo';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await api.post<User>('/auth/login', { email, password });
      login(user);
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/app', { replace: true });
      }
    } catch (err: any) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('We couldn\'t verify your credentials. Please try again.');
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
              <DragonflyLogo size="sm" showSubtitle={false} />
            </Link>
            <h2 className="text-[#26384B] leading-tight relative z-10" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', letterSpacing: '-0.04em', fontWeight: 900 }}>
              Welcome back.
            </h2>
            <Doodle type="leaf" className="absolute -top-4 right-0 w-12 h-12 text-[#4C6072] opacity-20 z-0" delay={0.4} />
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <Fade>
                <Alert variant="error" message={error} />
              </Fade>
            )}

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
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="flex justify-end mt-2">
                <Link to="/forgot-password" className="text-[10px] font-bold text-[#4C6072] hover:text-[#26384B] tracking-widest uppercase transition-colors">
                  Forgot Password?
                </Link>
              </div>
            </div>

            <div className="pt-1">
              <Button
                id="login-submit-btn"
                type="submit"
                variant="primary"
                className="w-full rounded-full"
                isLoading={isLoading}
              >
                Sign in
              </Button>
            </div>
          </form>

          {/* Divider */}
          <div className="my-5 text-center text-[#4C6072] text-[10px] font-bold uppercase tracking-widest relative">
            <span className="bg-white px-3 relative z-10">Or continue with</span>
            <div className="absolute top-1/2 left-0 right-0 h-px bg-[#26384B]/10" />
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
              Don't have an account?{' '}
              <Link to="/signup" className="text-[#26384B] hover:text-[#4C6072] font-bold transition-colors ml-1">
                CREATE AN ACCOUNT
              </Link>
            </Typography>
          </div>
        </Glass>
      </BlurReveal>
    </PageTransition>
  );
};

