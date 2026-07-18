import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import { api, ApiError } from '../lib/api';

// Mock the API globally
vi.mock('../lib/api', async () => {
  const actual = await vi.importActual('../lib/api');
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
    },
  };
});

describe('Onboarding and Profile Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('unauthenticated users cannot access /onboarding or /app', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new ApiError('Unauthorized', 401)); // /auth/me fails
    
    window.history.pushState({}, 'Test', '/onboarding');
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument(); // Redirected to login
    });
  });

  it('missing profile redirects /app to /onboarding', async () => {
    // 1. Auth succeeds
    vi.mocked(api.get).mockResolvedValueOnce({ id: 'user1', email: 'test@example.com' });
    // 2. Profile fails with 404
    vi.mocked(api.get).mockRejectedValueOnce(new ApiError('Not Found', 404));

    window.history.pushState({}, 'Test', '/app');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Let's understand your skin/i)).toBeInTheDocument();
    });
  });

  it('existing profile redirects /onboarding to /app', async () => {
    // 1. Auth succeeds
    vi.mocked(api.get).mockResolvedValueOnce({ id: 'user1', email: 'test@example.com' });
    // 2. Profile succeeds
    vi.mocked(api.get).mockResolvedValueOnce({ skin_type: 'oily' });

    window.history.pushState({}, 'Test', '/onboarding');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome to Ishkeen/i)).toBeInTheDocument();
    });
  });

  it('network error shows retry state and does not redirect to onboarding', async () => {
    // 1. Auth succeeds
    vi.mocked(api.get).mockResolvedValueOnce({ id: 'user1', email: 'test@example.com' });
    // 2. Profile fails with network error (no status)
    vi.mocked(api.get).mockRejectedValueOnce(new ApiError('Network error'));

    window.history.pushState({}, 'Test', '/app');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Connection Error/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      expect(screen.queryByText(/Let's understand your skin/i)).not.toBeInTheDocument();
    });
  });
});
