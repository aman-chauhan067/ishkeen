// VITE_API_BASE_URL should contain the trailing `/api`
const getDefaultBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && (
    window.location.hostname.endsWith('.pages.dev') ||
    window.location.hostname.endsWith('.workers.dev') ||
    window.location.hostname.includes('ishkeen')
  )) {
    return 'https://ishkeen.onrender.com/api';
  }
  return 'http://localhost:8000/api';
};

const BASE_URL = getDefaultBaseUrl();

export { BASE_URL };

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) {
    if (res.status === 204) {
      return {} as T;
    }
    return res.json();
  }

  let errorMessage = 'An unexpected error occurred';
  try {
    const data = await res.json();
    if (data && data.detail) {
      errorMessage = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
    }
  } catch {
    // If not JSON, try text
    try {
      const text = await res.text();
      if (text) errorMessage = text;
    } catch {
      // Ignore
    }
  }

  throw new ApiError(errorMessage, res.status);
}

function getAuthHeaders(custom: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...custom };
  const token = localStorage.getItem('ishkeen_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  get: async <T>(path: string): Promise<T> => {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        method: 'GET',
        headers: getAuthHeaders({
          'Content-Type': 'application/json',
        }),
        credentials: 'include',
      });
      return handleResponse<T>(res);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Network error or server unavailable');
    }
  },

  post: async <T>(path: string, body?: unknown): Promise<T> => {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: getAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
      });
      return handleResponse<T>(res);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Network error or server unavailable');
    }
  },

  put: async <T>(path: string, body?: unknown): Promise<T> => {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        method: 'PUT',
        headers: getAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
      });
      return handleResponse<T>(res);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Network error or server unavailable');
    }
  },

  patch: async <T>(path: string, body?: unknown): Promise<T> => {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        method: 'PATCH',
        headers: getAuthHeaders({
          'Content-Type': 'application/json',
        }),
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
      });
      return handleResponse<T>(res);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Network error or server unavailable');
    }
  },

  delete: async <T>(path: string): Promise<T> => {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        method: 'DELETE',
        headers: getAuthHeaders({
          'Content-Type': 'application/json',
        }),
        credentials: 'include',
      });
      return handleResponse<T>(res);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Network error or server unavailable');
    }
  },

  /**
   * POST a multipart/form-data request.
   * Do NOT set Content-Type manually — the browser must set the boundary automatically.
   */
  postForm: async <T>(path: string, formData: FormData): Promise<T> => {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: formData,
        // No Content-Type header: browser sets multipart/form-data with correct boundary
      });
      return handleResponse<T>(res);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Network error or server unavailable');
    }
  },

  /**
   * GET request that returns a Blob (e.g. for private image download).
   * Handles auth errors identically to other methods.
   */
  getBlob: async (path: string): Promise<Blob> => {
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}${path}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
    } catch {
      throw new ApiError('Network error or server unavailable');
    }
    if (!res.ok) {
      // Extract error text where possible
      let message = 'Failed to load resource';
      try {
        const data = await res.json();
        if (data?.detail) message = String(data.detail);
      } catch {
        // ignore
      }
      throw new ApiError(message, res.status);
    }
    return res.blob();
  },
};
