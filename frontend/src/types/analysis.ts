/**
 * TypeScript types for SkinAnalysis API responses.
 * Matches backend app/schemas/analysis.py exactly.
 */

export type AnalysisStatus =
  | 'created'
  | 'uploaded'
  | 'validating'
  | 'ready'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'rejected';

/** Maps a backend status value to a truthful, human-readable UI label. */
export function statusLabel(status: AnalysisStatus): string {
  switch (status) {
    case 'created':
    case 'uploaded':
      return 'Stored';
    case 'validating':
      return 'Validating';
    case 'ready':
      return 'Ready';
    case 'processing':
      return 'Processing';
    case 'completed':
      return 'Stored';
    case 'failed':
      return 'Failed';
    case 'rejected':
      return 'Rejected';
    default:
      return 'Stored';
  }
}

export interface SkinAnalysisResponse {
  id: string;
  status: AnalysisStatus;
  preprocessing_version: string;
  failure_code: string | null;
  ml_results?: {
    acne_detected: boolean;
    acne_confidence: number;
    concerns: Array<{
      name: string;
      confidence: number;
      severity: string;
      explanation: string;
      visual: string;
    }>;
    observations: Array<{
      observation: string;
      reason: string;
      implication: string;
      expected_improvement: string;
    }>;
    ingredients: {
      primary: Array<{name: string, why: string, benefit: string, time: string, compatibility: string}>;
      secondary: Array<{name: string, why: string, benefit: string, time: string, compatibility: string}>;
      barrier: Array<{name: string, why: string, benefit: string, time: string, compatibility: string}>;
      avoid: Array<{name: string, why: string, benefit: string, time: string, compatibility: string}>;
    };
  };
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface SkinAnalysisListResponse {
  items: SkinAnalysisResponse[];
  total: number;
  page: number;
  size: number;
}
