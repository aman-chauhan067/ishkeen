import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Container } from '../../components/ui/Container';
import { Fade, Stagger, StaggerItem, BlurReveal } from '../../components/motion';
import { useAuth } from '../../auth/AuthContext';
import { Camera, BookOpen } from 'lucide-react';

export const SkinJournal: React.FC = () => {
  const { user } = useAuth();
  
  const firstName = user?.email ? user.email.split('@')[0] : 'there';
  return (
    <Container className="pt-[180px] pb-32">
      <Stagger amount={0.1}>
        {/* Massive Journal Header */}
        <div className="mb-24">
          <StaggerItem>
            <BlurReveal>
              <h1 className="text-left text-[#26384B] mb-2 flex flex-col sm:flex-row items-baseline gap-1 sm:gap-4">
                <span className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tighter leading-none">Welcome,</span>
                <span className="text-5xl sm:text-7xl text-[#4C6072] font-medium tracking-normal opacity-80">{firstName}.</span>
              </h1>
            </BlurReveal>
          </StaggerItem>
          <StaggerItem>
            <Fade>
              <p className="mt-8 text-[#4C6072] text-lg font-medium tracking-wide max-w-lg text-left">
                Your clinical archive is ready. Document, analyze, and preserve the evolution of your physiology.
              </p>
            </Fade>
          </StaggerItem>
        </div>

        {/* Asymmetrical Layout */}
        <div className="flex flex-col lg:flex-row gap-24 items-start relative z-10">
          
          {/* Primary Action - Massive Upload Area */}
          <StaggerItem className="w-full lg:w-3/5">
            <Link to="/app/upload" className="block focus:outline-none group">
              <div className="p-12 h-[450px] flex flex-col justify-end relative overflow-hidden transition-all duration-700 bg-white/40 backdrop-blur-[40px] border border-white/60 shadow-[0_0_50px_rgba(59,130,246,0.15)] ring-1 ring-inset ring-white/50 rounded-[32px] hover:shadow-[0_0_60px_rgba(59,130,246,0.25)] hover:border-blue-300">
                <div className="absolute top-12 left-12 w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center transition-transform duration-700 group-hover:scale-110 shadow-sm border border-blue-200">
                  <Camera size={28} className="text-blue-600" strokeWidth={1.5} />
                </div>
                <div className="relative z-10 max-w-md text-left">
                  <h3 className="text-[#26384B] mb-4 flex flex-col sm:flex-row items-baseline gap-2">
                    <span className="text-7xl sm:text-8xl md:text-[110px] font-black tracking-tighter leading-none">New</span>
                    <span className="text-3xl sm:text-5xl font-light tracking-wide opacity-80">Entry</span>
                  </h3>
                  <p className="text-[#4C6072] text-base mb-10 font-medium">
                    Begin a clinical analysis by capturing your current state.
                  </p>
                  <Button variant="secondary" className="group-hover:border-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-500 pointer-events-none rounded-full px-8 bg-white/50 border-white/60 text-[#26384B]">
                    Capture Image
                  </Button>
                </div>
              </div>
            </Link>
          </StaggerItem>

          {/* Secondary Action - History */}
          <StaggerItem className="w-full lg:w-2/5 lg:mt-24">
            <Link to="/app/history" className="block focus:outline-none group">
              <div className="relative flex flex-col justify-end p-8 border border-white/60 bg-white/40 backdrop-blur-[40px] shadow-[0_0_50px_rgba(59,130,246,0.15)] ring-1 ring-inset ring-white/50 rounded-[32px] transition-all duration-[600ms] hover:border-blue-300 hover:shadow-[0_0_60px_rgba(59,130,246,0.25)] h-full">
                <div className="relative z-10 text-left pl-2">
                  <div className="mb-6 w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-200 transition-transform duration-700 group-hover:scale-110">
                    <BookOpen size={32} strokeWidth={1.5} />
                  </div>
                  <h4 className="app-heading-4 text-[#26384B] mb-4">The Archives</h4>
                  <p className="text-[#4C6072] mb-10 font-medium text-base">
                    Review past consultations and track your progression over time.
                  </p>
                  <div className="flex items-center gap-3 text-sm font-bold tracking-widest uppercase text-blue-600 group-hover:text-blue-700 transition-colors duration-[600ms]">
                    <span>Open Archive</span>
                    <span className="transition-transform duration-500 group-hover:translate-x-2">&rarr;</span>
                  </div>
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
