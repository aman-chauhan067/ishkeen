import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { ProfileProvider } from '../contexts/ProfileContext';
import { HistoryPage } from '../pages/app/HistoryPage';
import { api } from '../lib/api';
import type { SkinAnalysisResponse } from '../types/analysis';

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

const Wrapper = () => (
  <AuthProvider>
    <ProfileProvider>
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>
    </ProfileProvider>
  </AuthProvider>
);

const makeAnalysis = (id: string, status: SkinAnalysisResponse['status'] = 'uploaded'): SkinAnalysisResponse => ({
  id,
  status,
  preprocessing_version: '1.0',
  failure_code: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  completed_at: null
});

describe('History Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getBlob).mockResolvedValue(new Blob([''], { type: 'image/jpeg' }));
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const setupMocks = (listData: any, page2Data?: any) => {
    vi.mocked(api.get).mockImplementation((path: string) => {
      if (path === '/auth/me') return Promise.resolve({ id: 'u1', email: 'test@example.com' });
      if (path === '/skin-profile') return Promise.resolve({ skin_type: 'oily' });
      if (path.includes('page=1')) return Promise.resolve(listData);
      if (path.includes('page=2')) {
        if (page2Data instanceof Error) return Promise.reject(page2Data);
        return Promise.resolve(page2Data);
      }
      return Promise.resolve({});
    });
  };

  it('shows loading skeleton initially', async () => {
    vi.mocked(api.get).mockImplementation((path: string) => {
      if (path === '/auth/me') return Promise.resolve({ id: 'u1', email: 'test@example.com' });
      if (path === '/skin-profile') return Promise.resolve({ skin_type: 'oily' });
      if (path.includes('page=1')) return new Promise(() => {}); // pending
      return Promise.resolve({});
    });

    render(<Wrapper />);
    expect(screen.getByRole('status', { name: /Loading analysis history/i })).toBeInTheDocument();
  });

  it('empty state shown when total is 0', async () => {
    setupMocks({ items: [], total: 0, page: 1, size: 20 });
    render(<Wrapper />);
    
    await waitFor(() => {
      expect(screen.getByText('No photos uploaded yet.')).toBeInTheDocument();
    });
  });

  it('populated state shows analysis cards', async () => {
    setupMocks({
      items: [makeAnalysis('id1'), makeAnalysis('id2')],
      total: 2,
      page: 1,
      size: 20
    });
    
    render(<Wrapper />);
    
    await waitFor(() => {
      const storedLabels = screen.getAllByText('Stored');
      expect(storedLabels).toHaveLength(2);
    });
  });

  it('uploaded status maps to Stored label', async () => {
    setupMocks({
      items: [makeAnalysis('id1', 'uploaded')],
      total: 1,
      page: 1,
      size: 20
    });
    
    render(<Wrapper />);
    
    await waitFor(() => {
      expect(screen.getByText('Stored')).toBeInTheDocument();
    });
  });

  it('Load More absent when all items loaded', async () => {
    setupMocks({
      items: Array.from({ length: 20 }, (_, i) => makeAnalysis(`id${i}`)),
      total: 20,
      page: 1,
      size: 20
    });
    
    render(<Wrapper />);
    
    await waitFor(() => {
      expect(screen.getByText('All 20 uploads shown')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Load More/i })).not.toBeInTheDocument();
    });
  });

  it('Load More present when more items exist', async () => {
    setupMocks({
      items: Array.from({ length: 20 }, (_, i) => makeAnalysis(`id${i}`)),
      total: 25,
      page: 1,
      size: 20
    });
    
    render(<Wrapper />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Load More/i })).toBeInTheDocument();
    });
  });

  it('Load More calls API with page=2 and appends', async () => {
    setupMocks(
      { items: Array.from({ length: 20 }, (_, i) => makeAnalysis(`id${i}`)), total: 25, page: 1, size: 20 },
      { items: [makeAnalysis('id21')], total: 25, page: 2, size: 20 }
    );
    
    render(<Wrapper />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Load More/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Load More/i }));

    await waitFor(() => {
      const cards = screen.getAllByRole('article');
      expect(cards).toHaveLength(21);
    });
  });

  it('page 2 failure preserves page 1 items', async () => {
    setupMocks(
      { items: Array.from({ length: 20 }, (_, i) => makeAnalysis(`id${i}`)), total: 25, page: 1, size: 20 },
      new Error('Network error')
    );
    
    render(<Wrapper />);
    
    await waitFor(() => {
      expect(screen.getAllByRole('article')).toHaveLength(20);
    });

    fireEvent.click(screen.getByRole('button', { name: /Load More/i }));

    await waitFor(() => {
      expect(screen.getAllByRole('article')).toHaveLength(20);
      expect(screen.getByRole('button', { name: /Load More/i })).toBeInTheDocument();
    });
  });
});
