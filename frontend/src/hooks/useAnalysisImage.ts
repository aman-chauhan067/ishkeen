import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';

type ImageState =
  | { phase: 'loading' }
  | { phase: 'ready'; objectUrl: string }
  | { phase: 'error' };

/**
 * Fetches a private analysis image via authenticated fetch,
 * converts it to a Blob object URL, and manages the URL lifecycle.
 *
 * The object URL is deterministically revoked on:
 * - component unmount
 * - analysisId change (before the next fetch begins)
 * - fetch error (no URL is created)
 */
export function useAnalysisImage(analysisId: string) {
  const [state, setState] = useState<ImageState>({ phase: 'loading' });
  // Track the current object URL so we can revoke it deterministically
  const objectUrlRef = useRef<string | null>(null);
  // Abort controller for the in-flight fetch
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Revoke any prior URL before starting a new fetch
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    // Cancel any prior in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ phase: 'loading' });

    let mounted = true;

    api
      .getBlob(`/analyses/${analysisId}/image`)
      .then((blob) => {
        if (!mounted || controller.signal.aborted) {
          // Component unmounted or superseded — do not create an orphaned URL
          return;
        }
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        setState({ phase: 'ready', objectUrl: url });
      })
      .catch((error) => {
        if (!mounted || controller.signal.aborted) return;
        // AbortError is not a real error
        if (error instanceof Error && error.name === 'AbortError') return;
        // Any ApiError (404, 401, etc.) or network error — show error placeholder
        setState({ phase: 'error' });
      });

    return () => {
      mounted = false;
      controller.abort();
      // Revoke the object URL on unmount / analysisId change
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [analysisId]);

  return state;
}
