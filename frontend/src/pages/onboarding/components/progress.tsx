import React from 'react';
import { Typography } from '../../../components/ui/Typography';

export const ProgressHeader: React.FC<{ currentStep: number; totalSteps: number }> = ({ currentStep, totalSteps }) => {
  const percentage = Math.max(0, Math.min(100, (currentStep / totalSteps) * 100));

  return (
    <div className="w-full mb-12">
      <div className="flex justify-between items-end mb-4">
        <Typography variant="caption" className="uppercase tracking-widest font-semibold opacity-60">
          Consultation
        </Typography>
        <Typography variant="caption" className="opacity-50">
          {currentStep} / {totalSteps}
        </Typography>
      </div>
      <div className="h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-accent transition-all duration-700 ease-in-out" 
          style={{ width: `${percentage}%` }} 
        />
      </div>
    </div>
  );
};
