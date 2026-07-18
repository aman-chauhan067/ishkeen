import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Container } from '../components/ui/Container';
import { PageTransition, BlurReveal, Fade } from '../components/motion';
import { Doodle } from '../components/illustrations/Doodle';

import { useAuth } from '../auth/AuthContext';

const OpticalLens = React.lazy(() => import('../components/motion/OpticalLens'));

export const HomePage: React.FC = () => {
  const { status, user, logout } = useAuth();
  
  const handleLogout = async () => {
    await logout();
  };
  return (
    <PageTransition>
      {/* 
        The background outside the lens is strictly calm Paper White.
        Scrollbar is disabled on the body via global CSS or overflow-hidden here,
        because ScrollControls inside OpticalLens manages the scroll experience natively.
      */}
      <div className="relative w-full h-screen overflow-hidden bg-[#FCFBF8] flex items-center justify-center">
        
        {/* The Interactive Optical Lens (Scroll driver & WebGL Engine) */}
        <React.Suspense fallback={null}>
          <Fade className="absolute inset-0 w-full h-full z-0 pointer-events-auto" delay={0.5} duration={2}>
            <OpticalLens />
          </Fade>
        </React.Suspense>

        {/* Floating Doodles */}
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
          <Doodle type="sparkles" className="absolute top-[15%] left-[10%] w-12 h-12 text-[#5C7E9A] opacity-20" delay={1} />
          <Doodle type="leaf" className="absolute bottom-[20%] left-[5%] w-16 h-16 text-[#5C7E9A] opacity-20" delay={1.2} />
          <Doodle type="circle" className="absolute top-[25%] right-[15%] w-24 h-24 text-[#5C7E9A] opacity-10" delay={1.4} />
          <Doodle type="stars" className="absolute bottom-[10%] right-[10%] w-10 h-10 text-[#5C7E9A] opacity-20" delay={1.6} />
          <Doodle type="swirl" className="absolute top-[5%] right-[40%] w-20 h-20 text-[#5C7E9A] opacity-[0.07]" delay={1.8} />
        </div>

        <Container className="relative z-10 w-full h-full flex flex-col justify-center pointer-events-none">
          {/* We use pointer-events-none on the container so the lens can track the mouse everywhere,
              but we restore pointer-events-auto on the buttons specifically. */}
          <div className="max-w-[80vw] lg:max-w-[70vw] relative z-10 drop-shadow-sm flex flex-col gap-16">
            
            <BlurReveal>
              {/* Monumental Typography (180-240px) */}
              <h1 
                className="leading-[0.82] tracking-[-0.07em] text-[#253A4A] font-black"
                style={{ 
                  fontFamily: 'Helvetica, Arial, sans-serif',
                  fontSize: 'clamp(120px, 15vw, 240px)' 
                }}
              >
                ISHKEEN
              </h1>
            </BlurReveal>
            
            <Fade delay={0.5}>
              <p className="max-w-[500px] text-[#5C7E9A] text-xl lg:text-2xl font-medium tracking-wide">
                Professional clinical analysis, handcrafted for your unique physiology.
              </p>
            </Fade>
            
            <Fade delay={1}>
              <div className="flex gap-6 items-center pointer-events-auto mt-8">
                {status === 'authenticated' ? (
                  <>
                    <Link to={user?.role === 'admin' ? '/admin' : '/app'}>
                      <Button variant="primary" size="lg" className="rounded-full px-12 py-6 bg-[#253A4A] text-[#FCFBF8]">
                        GO TO DASHBOARD
                      </Button>
                    </Link>
                    <Button 
                      variant="secondary" 
                      size="lg" 
                      className="rounded-full px-12 py-6 border-[#253A4A] text-[#253A4A]"
                      onClick={handleLogout}
                    >
                      SIGN OUT
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login">
                      <Button variant="secondary" size="lg" className="rounded-full px-12 py-6 border-[#253A4A] text-[#253A4A]">
                        LOGIN
                      </Button>
                    </Link>
                    <Link to="/signup">
                      <Button variant="primary" size="lg" className="rounded-full px-12 py-6 bg-[#253A4A] text-[#FCFBF8]">
                        SIGN UP
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </Fade>

          </div>
        </Container>
      </div>
    </PageTransition>
  );
};
