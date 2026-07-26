import React, { useEffect, useState } from 'react';
import { PageTransition } from '../../components/motion';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../auth/AuthContext';

interface SessionInfo {
  id: string;
  device: string;
  ip: string;
  last_active: string;
  is_current: boolean;
}

import { Doodle } from '../../components/illustrations/Doodle';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const fetchSessions = async () => {
    try {
      const data = await api.get<SessionInfo[]>('/auth/sessions');
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const revokeSession = async (id: string) => {
    try {
      await api.delete(`/auth/sessions/${id}`);
      fetchSessions();
    } catch (err) {
      console.error('Failed to revoke session');
    }
  };

  const revokeOtherSessions = async () => {
    try {
      await api.delete('/auth/sessions');
      fetchSessions();
    } catch (err) {
      console.error('Failed to revoke other sessions');
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    try {
      await api.post('/auth/change-email', { email: newEmail });
      alert('Email updated! Please check your new inbox for a verification link.');
      setNewEmail('');
      // In a real app we'd reload user context here
      window.location.reload();
    } catch {
      alert('Failed to update email. It might be taken.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      window.location.href = '/login';
    } catch {
      alert('Encountered an error while signing out.');
      setIsLoggingOut(false);
    }
  };

  return (
    <PageTransition className="pt-36 pb-24 px-8 sm:px-12 max-w-4xl relative">
      <Doodle type="circle" className="absolute top-28 right-24 w-24 h-24 text-[#4C6072] opacity-10" delay={0.2} />
      <p className="font-editorial text-4xl text-[#26384B] mb-10 font-black relative z-10" style={{ letterSpacing: '-0.04em' }}>
        Account Settings
      </p>

      <div className="bg-[#F6F4EF] border border-[#26384B]/5 rounded-3xl p-8 max-w-3xl mb-8">
        <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-[#26384B] mb-6">Profile Settings</h2>
        <form onSubmit={handleEmailChange} className="max-w-md space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-[#4C6072] mb-2">Email Address</label>
            <div className="flex gap-2 items-start">
              <Input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail((e.target as HTMLInputElement).value)}
                placeholder={user?.email || 'New Email'}
                className="flex-1"
              />
              <Button type="submit" isLoading={emailLoading}>Update</Button>
            </div>
            {!user?.is_email_verified && <p className="text-amber-600 text-xs mt-2 font-medium">Your email is unverified.</p>}
          </div>
        </form>
      </div>

      <div className="bg-[#F6F4EF] border border-[#26384B]/5 rounded-3xl p-8 max-w-3xl mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-[#26384B]">Active Sessions</h2>
          <Button variant="outline" onClick={revokeOtherSessions} className="text-xs">Revoke All Other Sessions</Button>
        </div>

        {loading ? (
          <p className="text-[#4C6072] text-sm">Loading sessions...</p>
        ) : (
          <div className="space-y-4">
            {sessions.length === 0 && (
              <p className="text-[#4C6072] text-sm py-4">No active sessions found.</p>
            )}
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-4 border-b border-[#26384B]/5 last:border-0">
                <div>
                  <p className="text-[#26384B] font-medium text-sm flex items-center gap-2">
                    {s.device}
                    {s.is_current && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                        Current
                      </span>
                    )}
                  </p>
                  <p className="text-[#4C6072] text-xs mt-1">Last Active: {new Date(s.last_active).toLocaleString()}</p>
                </div>
                {!s.is_current && (
                  <Button variant="ghost" onClick={() => revokeSession(s.id)} className="text-red-500 hover:text-red-600 text-xs font-bold uppercase tracking-widest">
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[#F6F4EF] border border-[#26384B]/5 rounded-3xl p-8 max-w-3xl mb-8">
        <div className="flex flex-col gap-2">
          <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-red-500 mb-2">Account</h2>
          <p className="text-[#4C6072] text-sm mb-4">Sign out of your account on this device. This will end your current session and return you to the login screen.</p>
          <Button variant="danger" onClick={handleLogout} isLoading={isLoggingOut} className="w-full sm:w-auto self-start gap-2">
            <span className="text-lg leading-none" aria-hidden="true">🚪</span> Sign Out
          </Button>
        </div>
      </div>
    </PageTransition>
  );
};
