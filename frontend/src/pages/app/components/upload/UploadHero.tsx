import React from 'react';
import { Typography } from '../../../../components/ui/Typography';
import { BlurReveal, Fade, Stagger, StaggerItem } from '../../../../components/motion';
import { Doodle } from '../../../../components/illustrations/Doodle';

export const UploadHero: React.FC = () => {
  return (
    <div className="text-center mb-16 relative">
      <Doodle type="face" className="absolute -top-12 left-[15%] w-16 h-16 text-[#5C7E9A] opacity-20" delay={0.2} />
      <Doodle type="sparkles" className="absolute top-[20%] right-[15%] w-10 h-10 text-[#5C7E9A] opacity-20" delay={0.4} />
      
      <Stagger amount={1}>
        <StaggerItem>
          <BlurReveal>
            <Typography variant="h2" className="mb-6 relative z-10">
              Clinical Analysis
            </Typography>
          </BlurReveal>
        </StaggerItem>
        <StaggerItem>
          <Fade>
            <Typography variant="body" className="opacity-80 max-w-lg mx-auto relative z-10">
              Please provide a clear image for clinical evaluation. Your privacy is paramount.
            </Typography>
          </Fade>
        </StaggerItem>
      </Stagger>
    </div>
  );
};
