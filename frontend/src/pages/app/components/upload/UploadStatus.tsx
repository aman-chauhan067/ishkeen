import React from 'react';
import { Typography } from '../../../../components/ui/Typography';
import { Button } from '../../../../components/ui/Button';
import { CheckCircle2 } from 'lucide-react';
import { Fade, HoverLift } from '../../../../components/motion';

interface UploadStatusProps {
  createdId: string | null;
  onViewHistory: () => void;
  onUploadAnother: () => void;
}


export const UploadStatus: React.FC<UploadStatusProps> = ({
  createdId,
  onViewHistory,
  onUploadAnother
}) => {
  return (
    <Fade className="space-y-6 text-center">
      <div className="bg-success/10 border border-success/20 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
        
        <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4 relative z-10" strokeWidth={1.5} />
        <Typography variant="h3" className="mb-2 relative z-10">Analysis Complete</Typography>
        <Typography variant="caption" className="opacity-80 relative z-10">
          Your imagery has been securely processed and your clinical results are ready.
          {createdId && <span className="sr-only"> Analysis ID: {createdId}</span>}
        </Typography>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <HoverLift y={-2} className="w-full sm:w-auto">
          <Button onClick={onViewHistory} variant="primary" className="w-full rounded-full px-8">
            View Results
          </Button>
        </HoverLift>
        <HoverLift y={-2} className="w-full sm:w-auto">
          <Button onClick={onUploadAnother} variant="ghost" className="w-full rounded-full px-8">
            New Analysis
          </Button>
        </HoverLift>
      </div>
    </Fade>
  );
};
