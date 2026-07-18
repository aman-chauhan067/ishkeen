import React from 'react';
import { Typography } from '../../../components/ui/Typography';
import { Card } from '../../../components/ui/Card';
import { HoverLift } from '../../../components/motion';

export const QuestionSummary: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="py-4 border-b border-white/5 last:border-0">
    <Typography variant="caption" className="opacity-50 uppercase tracking-widest font-semibold mb-1">
      {label}
    </Typography>
    <Typography variant="body" className="font-medium text-white/90">
      {value}
    </Typography>
  </div>
);

export const ReviewCard: React.FC<{ title: string; children: React.ReactNode; onEdit?: () => void }> = ({ title, children, onEdit }) => (
  <HoverLift y={-2} className="w-full">
    <Card variant="glass" className="p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h3">{title}</Typography>
        {onEdit && (
          <button 
            onClick={onEdit} 
            className="text-sm font-medium text-accent hover:text-accent/80 transition-colors uppercase tracking-wider"
          >
            Edit
          </button>
        )}
      </div>
      <div>
        {children}
      </div>
    </Card>
  </HoverLift>
);
