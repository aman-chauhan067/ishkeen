import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';


import { AuthProvider } from '../auth/AuthContext';
import { ProtectedRoute } from '../routes/ProtectedRoute';
import { GuestRoute } from '../routes/GuestRoute';
import { LoginPage } from '../pages/auth/LoginPage';
import { SignupPage } from '../pages/auth/SignupPage';
import { AppShell } from '../pages/app/AppShell';
import { api, ApiError } from '../lib/api';

// Mock the API client
vi.mock('../lib/api', () => {
  return {
    api: {
      get: vi.fn(),
      post: vi.fn(),
    },
    ApiError: class ApiError extends Error {
      status?: number;
      constructor(message: string, status?: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
      }
    }
  };
});

const mockUser = {
  id: '1',
  email: 'test@example.com',
  role: 'user',
  is_email_verified: false,
  created_at: '2023-01-01T00:00:00Z',
};

const TestApp = ({ initialRoute = '/' }) => (
  <AuthProvider>
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/" element={<div>Public Home</div>} />
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />
        <Route path="/app" element={<ProtectedRoute><AppShell /></ProtectedRoute>} />
      </Routes>
    </MemoryRouter>
  </AuthProvider>
);

describe('Authentication Flow & Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles auth bootstrap loading state and authenticated /me bootstrap', async () => {
    // Delay API response to observe loading state
    vi.mocked(api.get).mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve(mockUser), 100)));
    
    render(<TestApp initialRoute="/app" />);
    
    // Initially shows Loading
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // After bootstrap, ProtectedRoute allows AppShell to render
    await waitFor(() => {
      expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    });
  });

  it('handles unauthenticated /me bootstrap and redirects guest to login', async () => {
    // API returns 401
    vi.mocked(api.get).mockRejectedValueOnce(new ApiError('Unauthorized', 401));
    
    render(<TestApp initialRoute="/app" />);
    
    // Loading first
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Then redirects to Login page (GuestRoute wraps it, allows access)
    await waitFor(() => {
      expect(screen.getByText('Sign in to Ishkeen')).toBeInTheDocument();
    });
  });

  it('redirects authenticated user away from guest routes (/login -> /app)', async () => {
    vi.mocked(api.get).mockResolvedValueOnce(mockUser);
    
    render(<TestApp initialRoute="/login" />);
    
    await waitFor(() => {
      // Navigates to AppShell if authenticated
      expect(screen.getByText('Welcome to Ishkeen')).toBeInTheDocument();
    });
  });

  it('handles successful login state transition', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new ApiError('Unauthorized', 401)); // Initial bootstrap
    vi.mocked(api.post).mockResolvedValueOnce(mockUser); // Login response
    
    render(<TestApp initialRoute="/login" />);
    
    await waitFor(() => {
      expect(screen.getByText('Sign in to Ishkeen')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      // Re-routed to /app after successful login
      expect(screen.getByText('Welcome to Ishkeen')).toBeInTheDocument();
    });
  });

  it('displays safe error on failed login', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new ApiError('Unauthorized', 401)); // Initial bootstrap
    vi.mocked(api.post).mockRejectedValueOnce(new ApiError('Invalid email or password', 401)); // Login response
    
    render(<TestApp initialRoute="/login" />);
    
    await waitFor(() => {
      expect(screen.getByText('Sign in to Ishkeen')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
      // Still on login page
      expect(screen.getByText('Sign in to Ishkeen')).toBeInTheDocument();
    });
  });

  it('prevents API submission on signup password mismatch', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new ApiError('Unauthorized', 401)); // Initial bootstrap
    
    render(<TestApp initialRoute="/signup" />);
    
    await waitFor(() => {
      expect(screen.getByText('Create an account')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      expect(api.post).not.toHaveBeenCalled();
    });
  });

  it('handles logout state transition', async () => {
    vi.mocked(api.get).mockResolvedValueOnce(mockUser); // Initial bootstrap
    vi.mocked(api.post).mockResolvedValueOnce({ message: 'Successfully logged out' }); // Logout response
    
    render(<TestApp initialRoute="/app" />);
    
    await waitFor(() => {
      expect(screen.getByText('Welcome to Ishkeen')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => {
      // Re-routed to login page after logout
      expect(screen.getByText('Sign in to Ishkeen')).toBeInTheDocument();
    });
  });
});
