import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AnalysisImage } from '../components/analysis/AnalysisImage';
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

describe('AnalysisImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state initially', () => {
    vi.mocked(api.getBlob).mockImplementation(() => new Promise(() => {})); // pending
    render(<AnalysisImage analysisId="123" alt="test" />);
    
    expect(screen.getByRole('status', { name: /Loading image/i })).toBeInTheDocument();
  });

  it('shows image on successful blob fetch', async () => {
    vi.mocked(api.getBlob).mockResolvedValueOnce(new Blob([''], { type: 'image/jpeg' }));
    render(<AnalysisImage analysisId="123" alt="test" />);
    
    await waitFor(() => {
      expect(screen.getByAltText('test')).toBeInTheDocument();
    });
  });

  it('shows error placeholder on 404', async () => {
    vi.mocked(api.getBlob).mockRejectedValueOnce(new ApiError('Not found', 404));
    render(<AnalysisImage analysisId="123" alt="test" />);
    
    await waitFor(() => {
      expect(screen.getByRole('img', { name: /Image unavailable/i })).toBeInTheDocument();
    });
  });

  it('revokes object URL on unmount', async () => {
    vi.mocked(api.getBlob).mockResolvedValueOnce(new Blob([''], { type: 'image/jpeg' }));
    const { unmount } = render(<AnalysisImage analysisId="123" alt="test" />);
    
    await waitFor(() => {
      expect(screen.getByAltText('test')).toBeInTheDocument();
    });

    unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
  });

  it('late async resolution after unmount does not leak URL', async () => {
    let resolveBlob: (b: Blob) => void;
    vi.mocked(api.getBlob).mockReturnValueOnce(new Promise(resolve => {
      resolveBlob = resolve;
    }));

    const { unmount } = render(<AnalysisImage analysisId="123" alt="test" />);
    
    // Component unmounts while fetch is in-flight
    unmount();

    // Now the fetch resolves
    resolveBlob!(new Blob([''], { type: 'image/jpeg' }));

    // Wait a tick for promises to flush
    await new Promise(r => setTimeout(r, 0));

    // It should NOT have created an object URL since it was unmounted
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
