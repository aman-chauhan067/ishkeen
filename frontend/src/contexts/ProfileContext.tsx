import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { SkinProfile } from '../types/profile';
import { useAuth } from '../auth/AuthContext';
import { useAuthenticatedApi } from '../hooks/useAuthenticatedApi';
import { ApiError } from '../lib/api';

export type ProfileStatus = 'loading' | 'missing' | 'available' | 'error';

interface ProfileState {
  status: ProfileStatus;
  profile: SkinProfile | null;
}

interface ProfileContextType extends ProfileState {
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { status: authStatus } = useAuth();
  const api = useAuthenticatedApi();
  
  const [state, setState] = useState<ProfileState>({
    status: 'loading',
    profile: null,
  });

  const loadProfile = useCallback(async () => {
    setState(s => ({ ...s, status: 'loading' }));
    try {
      const profile = await api.get<SkinProfile>('/skin-profile');
      setState({ status: 'available', profile });
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
        // If 403 (Unverified) or 404 (Missing), treat as missing profile so they can proceed in UI
        setState({ status: 'missing', profile: null });
      } else if (error instanceof ApiError && error.status === 401) {
        // Handled by useAuthenticatedApi, but we should clear profile state
        setState({ status: 'missing', profile: null });
      } else {
        // Network or 5xx error
        setState({ status: 'error', profile: null });
      }
    }
  }, [api]);

  useEffect(() => {
    let mounted = true;

    if (authStatus === 'authenticated') {
      loadProfile().then(() => {
        if (!mounted) return;
      });
    } else if (authStatus === 'unauthenticated') {
      setState({ status: 'loading', profile: null });
    }

    return () => {
      mounted = false;
    };
  }, [authStatus, loadProfile]);

  return (
    <ProfileContext.Provider value={{ ...state, refreshProfile: loadProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
