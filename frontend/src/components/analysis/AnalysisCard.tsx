import React from 'react';
import type { SkinAnalysisResponse } from '../../types/analysis';
import { statusLabel } from '../../types/analysis';
import { AnalysisImage } from './AnalysisImage';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface AnalysisCardProps {
  analysis: SkinAnalysisResponse;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export const AnalysisCard: React.FC<AnalysisCardProps> = ({ analysis }) => {
  const label = statusLabel(analysis.status);
  const dateStr = formatDate(analysis.created_at);
  const isFailed = analysis.status === 'failed' || analysis.status === 'rejected';

  return (
    <Card
      variant="interactive"
      className="flex items-center gap-10"
      aria-label={`Analysis from ${dateStr}, status: ${label}`}
    >
      <div className="flex-shrink-0 rounded-[20px] overflow-hidden border border-[#253A4A]/5 w-32 h-32 sm:w-40 sm:h-40">
        <AnalysisImage
          analysisId={analysis.id}
          alt={`Skin photo uploaded on ${dateStr}`}
          className="w-full h-full object-cover transition-transform duration-[800ms] hover:scale-105"
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-3">
        <Typography variant="h4" className="font-editorial">{dateStr}</Typography>
        <div className="flex items-center gap-2">
          <Badge variant={isFailed ? 'danger' : 'neutral'}>
            {label}
          </Badge>
        </div>
        {analysis.failure_code && (
          <Typography variant="caption" className="opacity-60 truncate">
            Code: {analysis.failure_code}
          </Typography>
        )}
      </div>
    </Card>
  );
};
