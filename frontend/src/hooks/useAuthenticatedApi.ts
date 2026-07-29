import { useCallback, useMemo } from 'react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../auth/AuthContext';

/**
 * A reusable hook that wraps the global api client.
 * It automatically handles 401 Unauthorized errors by transitioning
 * the AuthContext back to the unauthenticated state, avoiding duplicate
 * logic across different components.
 */
export function useAuthenticatedApi() {
  const { setUnauthenticated } = useAuth();

  const handleApiError = useCallback((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      setUnauthenticated();
    }
    throw error;
  }, [setUnauthenticated]);

  const get = useCallback(async <T>(path: string): Promise<T> => {
    try {
      return await api.get<T>(path);
    } catch (error) {
      return handleApiError(error);
    }
  }, [handleApiError]);

  const post = useCallback(async <T>(path: string, body?: unknown): Promise<T> => {
    try {
      return await api.post<T>(path, body);
    } catch (error) {
      return handleApiError(error);
    }
  }, [handleApiError]);

  const patch = useCallback(async <T>(path: string, body?: unknown): Promise<T> => {
    try {
      return await api.patch<T>(path, body);
    } catch (error) {
      return handleApiError(error);
    }
  }, [handleApiError]);

  const postForm = useCallback(async <T>(path: string, formData: FormData): Promise<T> => {
    try {
      return await api.postForm<T>(path, formData);
    } catch (error) {
      return handleApiError(error);
    }
  }, [handleApiError]);

  const getBlob = useCallback(async (path: string): Promise<Blob> => {
    try {
      return await api.getBlob(path);
    } catch (error) {
      return handleApiError(error);
    }
  }, [handleApiError]);

  return useMemo(() => ({ get, post, patch, postForm, getBlob }), [get, post, patch, postForm, getBlob]);
}
