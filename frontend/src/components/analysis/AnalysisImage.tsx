import React from 'react';
import { useAnalysisImage } from '../../hooks/useAnalysisImage';

interface AnalysisImageProps {
  analysisId: string;
  /** Alt text for the image */
  alt: string;
  className?: string;
}

/**
 * Renders a private analysis image by fetching it with authenticated credentials.
 * Shows a loading skeleton and an error placeholder.
 */
export const AnalysisImage: React.FC<AnalysisImageProps> = ({ analysisId, alt, className = '' }) => {
  const imageState = useAnalysisImage(analysisId);

  if (imageState.phase === 'loading') {
    return (
      <div
        className={`bg-skin-dark animate-pulse rounded ${className}`}
        role="status"
        aria-label="Loading image"
      />
    );
  }

  if (imageState.phase === 'error') {
    return (
      <div
        className={`bg-skin-dark flex items-center justify-center rounded ${className}`}
        role="img"
        aria-label="Image unavailable"
      >
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={imageState.objectUrl}
      alt={alt}
      className={`object-cover rounded ${className}`}
    />
  );
};
