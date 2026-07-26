export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  is_email_verified: boolean;
  name?: string;
  avatar_url?: string;
  created_at: string;
  token?: string;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  user: User | null;
}
