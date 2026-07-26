import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthState, User } from './types';
import { api, ApiError } from '../lib/api';

interface AuthContextType extends AuthState {
  login: (user: User) => void;
  logout: () => Promise<void>;
  setUnauthenticated: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: 'loading',
    user: null,
  });

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const user = await api.get<User>('/auth/me');
        if (mounted) {
          if (user.token) {
            localStorage.setItem('ishkeen_token', user.token);
          }
          setState({ status: 'authenticated', user });
        }
      } catch {
        if (mounted) {
          // Whether 401 or network failure, we treat as unauthenticated initially.
          // The route guards will protect the app. If it's a network error, 
          // they might see login page, which they can't submit anyway without network.
          setState({ status: 'unauthenticated', user: null });
        }
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  const login = (user: User) => {
    if (user.token) {
      localStorage.setItem('ishkeen_token', user.token);
    }
    setState({ status: 'authenticated', user });
  };

  const logout = async () => {
    localStorage.removeItem('ishkeen_token');
    try {
      await api.post('/auth/logout');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        // Already unauthorized/expired, treat as success
      } else {
        throw error; // Let the caller handle network errors (e.g., show a toast)
      }
    }
    setState({ status: 'unauthenticated', user: null });
  };

  const setUnauthenticated = () => {
    localStorage.removeItem('ishkeen_token');
    setState({ status: 'unauthenticated', user: null });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, setUnauthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
