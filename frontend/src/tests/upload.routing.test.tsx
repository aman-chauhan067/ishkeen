import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import { api, ApiError } from '../lib/api';

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual('../lib/api');
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      postForm: vi.fn(),
      getBlob: vi.fn()
    },
  };
});

describe('Upload and History Route Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAuth = (email?: string) => {
    if (email) {
      vi.mocked(api.get).mockResolvedValueOnce({ id: 'user1', email });
    } else {
      vi.mocked(api.get).mockRejectedValueOnce(new ApiError('Unauthorized', 401));
    }
  };

  const mockProfile = (exists: boolean) => {
    if (exists) {
      vi.mocked(api.get).mockResolvedValueOnce({ skin_type: 'oily' });
    } else {
      vi.mocked(api.get).mockRejectedValueOnce(new ApiError('Not Found', 404));
    }
  };

  it('unauthenticated user accessing /app/upload redirects to /login', async () => {
    mockAuth();
    window.history.pushState({}, 'Test', '/app/upload');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
    });
  });

  it('unauthenticated user accessing /app/history redirects to /login', async () => {
    mockAuth();
    window.history.pushState({}, 'Test', '/app/history');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
    });
  });

  it('authenticated user without profile accessing /app/upload redirects to /onboarding', async () => {
    mockAuth('test@example.com');
    mockProfile(false);
    window.history.pushState({}, 'Test', '/app/upload');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Let's understand your skin/i)).toBeInTheDocument();
    });
  });

  it('authenticated user without profile accessing /app/history redirects to /onboarding', async () => {
    mockAuth('test@example.com');
    mockProfile(false);
    window.history.pushState({}, 'Test', '/app/history');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Let's understand your skin/i)).toBeInTheDocument();
    });
  });

  it('authenticated user with profile can access /app/upload', async () => {
    mockAuth('test@example.com');
    mockProfile(true);
    window.history.pushState({}, 'Test', '/app/upload');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Upload a Skin Photo/i)).toBeInTheDocument();
    });
  });

  it('authenticated user with profile can access /app/history', async () => {
    mockAuth('test@example.com');
    mockProfile(true);
    vi.mocked(api.get).mockResolvedValueOnce({ items: [], total: 0, page: 1, size: 20 });
    vi.mocked(api.getBlob).mockResolvedValue(new Blob([''], { type: 'image/jpeg' }));
    
    window.history.pushState({}, 'Test', '/app/history');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/No photos uploaded yet./i)).toBeInTheDocument();
    });
  });
});
