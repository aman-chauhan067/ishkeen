import { useState, useCallback } from 'react';
import { useAuthenticatedApi } from './useAuthenticatedApi';
import { ApiError } from '../lib/api';
import type { SkinAnalysisResponse, SkinAnalysisListResponse } from '../types/analysis';

const PAGE_SIZE = 20;

export type AnalysesState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'loaded'; items: SkinAnalysisResponse[]; total: number; page: number; loadingMore: boolean };

export function useAnalyses() {
  const api = useAuthenticatedApi();
  const [state, setState] = useState<AnalysesState>({ phase: 'idle' });

  const load = useCallback(async () => {
    setState({ phase: 'loading' });
    try {
      const data = await api.get<SkinAnalysisListResponse>(`/analyses?page=1&size=${PAGE_SIZE}`);
      setState({
        phase: 'loaded',
        items: data.items,
        total: data.total,
        page: 1,
        loadingMore: false,
      });
    } catch (error) {
      const msg =
        error instanceof ApiError
          ? 'Unable to load your history. Please try again.'
          : 'Network error. Please check your connection.';
      setState({ phase: 'error', message: msg });
    }
  }, [api]);

  const loadMore = useCallback(async () => {
    if (state.phase !== 'loaded' || state.loadingMore) return;
    const nextPage = state.page + 1;
    const { items: currentItems, total } = state;

    setState({ ...state, loadingMore: true });
    try {
      const data = await api.get<SkinAnalysisListResponse>(
        `/analyses?page=${nextPage}&size=${PAGE_SIZE}`,
      );
      setState({
        phase: 'loaded',
        items: [...currentItems, ...data.items],
        total,
        page: nextPage,
        loadingMore: false,
      });
    } catch {
      // Preserve existing items; just stop the loading spinner
      setState({ ...state, loadingMore: false });
    }
  }, [api, state]);

  const hasMore = state.phase === 'loaded' && state.items.length < state.total;

  return { state, load, loadMore, hasMore };
}
