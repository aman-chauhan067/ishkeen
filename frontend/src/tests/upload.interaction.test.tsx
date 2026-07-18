import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { ProfileProvider } from '../contexts/ProfileContext';
import { UploadPage } from '../pages/app/UploadPage';
import { api } from '../lib/api';

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

describe('Upload Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const setupAuth = () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ id: 'u1', email: 'test@example.com' })
      .mockResolvedValueOnce({ skin_type: 'oily' });
  };

  const createFile = (name: string, type: string, size: number) => {
    const file = new File([''], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };

  const selectFile = (file: File) => {
    const input = document.getElementById('skin-image-input') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    fireEvent.change(input);
  };

  it('renders guidance screen and photo tips initially', async () => {
    setupAuth();
    render(<Wrapper />);
    await waitFor(() => {
      expect(screen.getByText('Photo tips')).toBeInTheDocument();
      expect(screen.getByText('Face centered and looking straight ahead')).toBeInTheDocument();
    });
  });

  it('valid JPEG file shows preview image', async () => {
    setupAuth();
    render(<Wrapper />);
    await waitFor(() => expect(screen.getByText('Photo tips')).toBeInTheDocument());

    const file = createFile('test.jpg', 'image/jpeg', 1024 * 1024);
    selectFile(file);

    await waitFor(() => {
      expect(screen.getByAltText('Preview of selected skin photo')).toBeInTheDocument();
    });
  });

  it('valid PNG file shows preview image', async () => {
    setupAuth();
    render(<Wrapper />);
    await waitFor(() => expect(screen.getByText('Photo tips')).toBeInTheDocument());

    const file = createFile('test.png', 'image/png', 1024 * 1024);
    selectFile(file);

    await waitFor(() => {
      expect(screen.getByAltText('Preview of selected skin photo')).toBeInTheDocument();
    });
  });

  it('invalid file type shows error, no preview created', async () => {
    setupAuth();
    render(<Wrapper />);
    await waitFor(() => expect(screen.getByText('Photo tips')).toBeInTheDocument());

    const file = createFile('test.pdf', 'application/pdf', 1024 * 1024);
    selectFile(file);

    await waitFor(() => {
      expect(screen.getByText(/Only JPEG, PNG, and WebP images are supported/i)).toBeInTheDocument();
      expect(screen.queryByAltText('Preview of selected skin photo')).not.toBeInTheDocument();
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    });
  });

  it('file over 10MB shows error, no preview', async () => {
    setupAuth();
    render(<Wrapper />);
    await waitFor(() => expect(screen.getByText('Photo tips')).toBeInTheDocument());

    const file = createFile('large.jpg', 'image/jpeg', 11 * 1024 * 1024);
    selectFile(file);

    await waitFor(() => {
      expect(screen.getByText(/too large/i)).toBeInTheDocument();
      expect(screen.queryByAltText('Preview of selected skin photo')).not.toBeInTheDocument();
    });
  });

  it('clearing selected image revokes object URL and shows guidance', async () => {
    setupAuth();
    render(<Wrapper />);
    await waitFor(() => expect(screen.getByText('Photo tips')).toBeInTheDocument());

    const file = createFile('test.jpg', 'image/jpeg', 1024 * 1024);
    selectFile(file);

    await waitFor(() => {
      expect(screen.getByAltText('Preview of selected skin photo')).toBeInTheDocument();
    });

    const clearBtn = document.getElementById('upload-clear-btn') as HTMLButtonElement;
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
      expect(screen.queryByAltText('Preview of selected skin photo')).not.toBeInTheDocument();
      expect(screen.getByText('Photo tips')).toBeInTheDocument();
    });
  });

  it('replacing image: selecting second file revokes first URL', async () => {
    setupAuth();
    render(<Wrapper />);
    await waitFor(() => expect(screen.getByText('Photo tips')).toBeInTheDocument());

    const file1 = createFile('test1.jpg', 'image/jpeg', 1024 * 1024);
    selectFile(file1);

    await waitFor(() => {
      expect(screen.getByAltText('Preview of selected skin photo')).toBeInTheDocument();
    });

    // Replace
    const file2 = createFile('test2.jpg', 'image/jpeg', 1024 * 1024);
    selectFile(file2);

    await waitFor(() => {
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
    });
  });

  it('duplicate submit prevented: upload button disabled while uploading', async () => {
    setupAuth();
    render(<Wrapper />);
    await waitFor(() => expect(screen.getByText('Photo tips')).toBeInTheDocument());

    const file = createFile('test.jpg', 'image/jpeg', 1024 * 1024);
    selectFile(file);

    await waitFor(() => expect(screen.getByAltText('Preview of selected skin photo')).toBeInTheDocument());

    vi.mocked(api.postForm).mockImplementationOnce(() => new Promise(() => {}));
    
    const uploadBtn = screen.getByRole('button', { name: /Upload for Analysis/i });
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(uploadBtn).toBeDisabled();
      expect(uploadBtn).toHaveAttribute('aria-busy', 'true');
    });
  });

  it('unmount revokes active URL', async () => {
    setupAuth();
    const { unmount } = render(<Wrapper />);
    await waitFor(() => expect(screen.getByText('Photo tips')).toBeInTheDocument());

    const file = createFile('test.jpg', 'image/jpeg', 1024 * 1024);
    selectFile(file);

    await waitFor(() => expect(screen.getByAltText('Preview of selected skin photo')).toBeInTheDocument());

    unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
  });
});
