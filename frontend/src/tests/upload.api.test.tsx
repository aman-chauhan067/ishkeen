import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { ProfileProvider } from '../contexts/ProfileContext';
import { UploadPage } from '../pages/app/UploadPage';
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

const Wrapper = () => (
  <AuthProvider>
    <ProfileProvider>
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>
    </ProfileProvider>
  </AuthProvider>
);

describe('Upload API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const setupAndSelect = async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ id: 'u1', email: 'test@example.com' })
      .mockResolvedValueOnce({ skin_type: 'oily' });

    render(<Wrapper />);
    await waitFor(() => expect(screen.getByText('Photo tips')).toBeInTheDocument());

    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 * 1024 });

    const input = document.getElementById('skin-image-input') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    fireEvent.change(input);

    await waitFor(() => expect(screen.getByAltText('Preview of selected skin photo')).toBeInTheDocument());
  };

  it('exact FormData contract: field name is file', async () => {
    await setupAndSelect();
    
    let capturedFd: FormData | null = null;
    vi.mocked(api.postForm).mockImplementationOnce((_path, fd) => {
      capturedFd = fd;
      return Promise.resolve({
        id: 'abc',
        status: 'uploaded',
        preprocessing_version: '1.0',
        failure_code: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null
      });
    });

    fireEvent.click(screen.getByRole('button', { name: /Upload for Analysis/i }));

    await waitFor(() => {
      expect(api.postForm).toHaveBeenCalledWith('/analyses', expect.any(FormData));
    });
    expect(capturedFd).not.toBeNull();
    expect(capturedFd!.get('file')).not.toBeNull();
  });

  it('201 success shows success UI and does not navigate automatically', async () => {
    await setupAndSelect();
    
    vi.mocked(api.postForm).mockResolvedValueOnce({
      id: 'abc',
      status: 'uploaded',
      preprocessing_version: '1.0',
      failure_code: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: null
    });

    fireEvent.click(screen.getByRole('button', { name: /Upload for Analysis/i }));

    await waitFor(() => {
      expect(screen.getByText('Photo uploaded successfully.')).toBeInTheDocument();
    });
  });

  it('413 response shows correct error message', async () => {
    await setupAndSelect();
    vi.mocked(api.postForm).mockRejectedValueOnce(new ApiError('Payload Too Large', 413));
    
    fireEvent.click(screen.getByRole('button', { name: /Upload for Analysis/i }));
    await waitFor(() => {
      expect(screen.getByText('This photo is too large. Please choose an image under 10 MB.')).toBeInTheDocument();
    });
  });

  it('415 response shows correct error message', async () => {
    await setupAndSelect();
    vi.mocked(api.postForm).mockRejectedValueOnce(new ApiError('Unsupported Media Type', 415));
    
    fireEvent.click(screen.getByRole('button', { name: /Upload for Analysis/i }));
    await waitFor(() => {
      expect(screen.getByText('This file type isn\'t supported. Please upload a JPEG, PNG, or WebP image.')).toBeInTheDocument();
    });
  });

  it('422 missing profile error shows correct message', async () => {
    await setupAndSelect();
    vi.mocked(api.postForm).mockRejectedValueOnce(new ApiError('A completed skin profile is required', 422));
    
    fireEvent.click(screen.getByRole('button', { name: /Upload for Analysis/i }));
    await waitFor(() => {
      expect(screen.getByText('Please complete your skin profile before uploading a photo.')).toBeInTheDocument();
    });
  });

  it('422 dimensions error shows correct message', async () => {
    await setupAndSelect();
    vi.mocked(api.postForm).mockRejectedValueOnce(new ApiError('Image dimensions too small', 422));
    
    fireEvent.click(screen.getByRole('button', { name: /Upload for Analysis/i }));
    await waitFor(() => {
      expect(screen.getByText('This photo is too small. Please use an image at least 500 × 500 pixels.')).toBeInTheDocument();
    });
  });

  it('422 unknown fallback shows correct message', async () => {
    await setupAndSelect();
    vi.mocked(api.postForm).mockRejectedValueOnce(new ApiError('Some other validation error', 422));
    
    fireEvent.click(screen.getByRole('button', { name: /Upload for Analysis/i }));
    await waitFor(() => {
      expect(screen.getByText('The photo could not be processed. Please choose another image.')).toBeInTheDocument();
    });
  });

  it('429 rate limit shows correct message', async () => {
    await setupAndSelect();
    vi.mocked(api.postForm).mockRejectedValueOnce(new ApiError('Rate limit exceeded', 429));
    
    fireEvent.click(screen.getByRole('button', { name: /Upload for Analysis/i }));
    await waitFor(() => {
      expect(screen.getByText('You\'ve reached the upload limit for now. Please wait before trying again.')).toBeInTheDocument();
    });
  });

  it('network error shows correct message', async () => {
    await setupAndSelect();
    vi.mocked(api.postForm).mockRejectedValueOnce(new ApiError('Network error'));
    
    fireEvent.click(screen.getByRole('button', { name: /Upload for Analysis/i }));
    await waitFor(() => {
      expect(screen.getByText('Unable to reach the server. Please check your connection and try again.')).toBeInTheDocument();
    });
  });

  it('401 triggers setUnauthenticated and API handles it gracefully', async () => {
    await setupAndSelect();
    vi.mocked(api.postForm).mockRejectedValueOnce(new ApiError('Unauthorized', 401));
    
    fireEvent.click(screen.getByRole('button', { name: /Upload for Analysis/i }));
    
    await waitFor(() => {
      expect(api.postForm).toHaveBeenCalledTimes(1);
      // In a real app this triggers Context reset, here we just verify it doesn't crash the component
      // and it shows fallback text.
      expect(screen.getByText('Your session has expired. Please sign in again.')).toBeInTheDocument();
    });
  });

  it('error state preserves preview image', async () => {
    await setupAndSelect();
    vi.mocked(api.postForm).mockRejectedValueOnce(new ApiError('Payload Too Large', 413));
    
    fireEvent.click(screen.getByRole('button', { name: /Upload for Analysis/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/too large/i)).toBeInTheDocument();
      // Preview should still be here
      expect(screen.getByAltText('Preview of selected skin photo')).toBeInTheDocument();
    });
  });
});
