import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Container } from '../../components/ui/Container';
import { Fade, Stagger, StaggerItem, BlurReveal } from '../../components/motion';
import { Card } from '../../components/ui/Card';
import { AmbientGlow } from '../../components/motion/AmbientGlow';

export const SkinJournal: React.FC = () => {
  return (
    <Container className="pt-[180px] pb-32">
      <Stagger amount={0.1}>
        {/* Massive Journal Header */}
        <div className="mb-[120px]">
          <StaggerItem>
            <BlurReveal>
              <h1 className="max-w-[80%] lg:max-w-[70%] text-left">The Skin Journal.</h1>
            </BlurReveal>
          </StaggerItem>
          <StaggerItem>
            <Fade>
              <p className="mt-12 text-[#4C6072] text-lg lg:text-xl font-medium tracking-wide max-w-lg text-left">
                Your personal clinical archive. Document, analyze, and preserve the evolution of your physiology.
              </p>
            </Fade>
          </StaggerItem>
        </div>

        {/* Asymmetrical Layout */}
        <div className="flex flex-col lg:flex-row gap-24 items-start relative z-10">
          
          {/* Primary Action - Massive Upload Area */}
          <StaggerItem className="w-full lg:w-3/5">
            <Link to="/app/upload" className="block focus:outline-none">
              <Card variant="interactive" className="p-16 h-[500px] flex flex-col justify-end relative overflow-hidden group">
                <AmbientGlow blur="blur-[140px]" />
                <div className="relative z-10 max-w-md text-left">
                  <h3 className="text-[#26384B] mb-6">New Entry</h3>
                  <p className="text-[#4C6072] text-lg mb-12 font-medium">
                    Begin a clinical analysis by capturing your current state.
                  </p>
                  <Button variant="secondary" className="group-hover:border-[#26384B]/20 pointer-events-none">
                    Capture Image
                  </Button>
                </div>
              </Card>
            </Link>
          </StaggerItem>

          {/* Secondary Action - History */}
          <StaggerItem className="w-full lg:w-2/5 lg:mt-32">
            <Link to="/app/history" className="block focus:outline-none group">
              <div className="relative flex flex-col justify-end p-8 border-l border-[#26384B]/10 transition-colors duration-[600ms] group-hover:border-[#26384B]/30">
                <AmbientGlow blur="blur-[100px]" opacity="opacity-0 group-hover:opacity-[0.08]" />
                <div className="relative z-10 text-left pl-8">
                  <h4 className="text-[#26384B] mb-6">The Archives</h4>
                  <p className="text-[#4C6072] mb-12 font-medium text-lg">
                    Review past consultations and track your progression over time.
                  </p>
                  <span className="text-sm font-bold tracking-widest uppercase text-[#26384B] group-hover:text-[#C67C5A] transition-colors duration-[600ms]">Open Archive &rarr;</span>
                </div>
              </div>
            </Link>
          </StaggerItem>

        </div>
      </Stagger>
    </Container>
  );
};

export { SkinJournal as AppDashboard };
