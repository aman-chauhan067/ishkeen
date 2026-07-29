import React from 'react';
import { Typography } from '../../../../components/ui/Typography';
import { BlurReveal, Fade, Stagger, StaggerItem } from '../../../../components/motion';

export const UploadHero: React.FC = () => {
  return (
    <div className="text-center mb-16 relative">
      
      <Stagger amount={1}>
        <StaggerItem>
          <BlurReveal>
            <h1 className="text-[#26384B] mb-6 relative z-10 flex flex-wrap justify-center items-baseline gap-3 sm:gap-4">
              <span>Clinical</span>
              <span className="text-5xl sm:text-7xl text-[#4C6072] font-medium tracking-normal opacity-80">Analysis</span>
            </h1>
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
