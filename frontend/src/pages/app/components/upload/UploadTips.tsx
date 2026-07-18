import React from 'react';
import { Typography } from '../../../../components/ui/Typography';
import { HoverLift } from '../../../../components/motion';

interface UploadTipsProps {
  tips: { icon: string; text: string }[];
}

export const UploadTips: React.FC<UploadTipsProps> = ({ tips }) => {
  return (
    <HoverLift y={-2} className="w-full">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
        <Typography variant="caption" className="font-semibold uppercase tracking-widest mb-4 opacity-60">
          Guidelines for Optimal Analysis
        </Typography>
        <ul className="space-y-3">
          {tips.map((tip) => (
            <li key={tip.text} className="flex items-center gap-4">
              <span className="text-xl" aria-hidden="true">{tip.icon}</span>
              <Typography variant="caption" className="opacity-80">
                {tip.text}
              </Typography>
            </li>
          ))}
        </ul>
      </div>
    </HoverLift>
  );
};
