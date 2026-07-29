import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Container } from '../components/ui/Container';
import { PageTransition, Fade } from '../components/motion';
import { useAuth } from '../auth/AuthContext';

import {
  Navbar,
  StatsSection,
  HowItWorksSection,
  ClinicalScienceSection,
  ComparisonSection,
  TestimonialsSection,
  Footer,
  DragonflyMarquee,
  FinalCtaSection,
  HeroKineticTitle,
} from '../components/landing';

export const HomePage: React.FC = () => {
  const { status, user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <PageTransition>
      <div className="min-h-screen w-full text-[#26384B] relative selection:bg-[#26384B] selection:text-[#F6F4EF] overflow-x-hidden">

        {/* =========================================================
            FOUR CORNER LETTERS ON VIEWPORT (Exact Dragonfly.xyz signature)
            ========================================================= */}
        <div className="fixed top-24 left-8 z-20 pointer-events-none hidden md:block font-editorial text-4xl lg:text-5xl text-[#26384B]/30 select-none">
          I
        </div>
        <div className="fixed top-24 right-8 z-20 pointer-events-none hidden md:block font-editorial text-4xl lg:text-5xl text-[#26384B]/30 select-none">
          S
        </div>
        <div className="fixed bottom-8 left-8 z-20 pointer-events-none hidden md:block font-editorial text-4xl lg:text-5xl text-[#26384B]/30 select-none">
          H
        </div>
        <div className="fixed bottom-8 right-8 z-20 pointer-events-none hidden md:block font-editorial text-4xl lg:text-5xl text-[#26384B]/30 select-none">
          K
        </div>

        {/* Fixed Navigation Bar */}
        <Navbar />

        {/* =========================================================
            1. HERO SECTION (Monumental Editorial Display Title)
            ========================================================= */}
        <section className="relative w-full min-h-[95vh] pt-32 pb-20 flex flex-col items-center justify-center overflow-hidden border-b border-[#26384B]/15 bg-transparent z-10">
          {/* Corner Technical Telemetry Coordinates */}
          <div className="absolute top-28 left-16 hidden sm:flex items-center gap-2 font-mono-tech text-[10px] text-[#4C6072]">
            <span className="text-[#C67C5A]">+</span>
            <span>[ LAT // 43.119° N ]</span>
          </div>
          <div className="absolute top-28 right-16 hidden sm:flex items-center gap-2 font-mono-tech text-[10px] text-[#4C6072]">
            <span>[ SYS // CLINICAL_AI_v2.4 ]</span>
            <span className="text-[#C67C5A]">+</span>
          </div>

          <Container className="relative z-10 w-full flex flex-col items-center justify-center pt-8 md:pt-12">
            {/* Monospace System Badge */}
            <Fade delay={0.2}>
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-none border border-[#26384B]/20 bg-[#F6F4EF]/80 backdrop-blur-sm font-mono-tech text-xs uppercase tracking-widest text-[#26384B] mb-6 shadow-sm">
                <span className="w-2 h-2 rounded-none bg-[#C67C5A] animate-pulse" />
                <span>[ HYBRID CLINICAL INTELLIGENCE &amp; 43-POINT FACIAL MESH ]</span>
              </div>
            </Fade>

            {/* Monumental Editorial Display Title: ISHKEEN with Avant-Garde Kinetic Typography */}
            <Fade delay={0.4} className="w-full text-center">
              <HeroKineticTitle />
            </Fade>

            {/* Editorial Subtitle & High-Contrast CTAs */}
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto mt-6 sm:mt-8 z-20">
              <Fade delay={0.6}>
                <p className="font-editorial text-2xl sm:text-3xl md:text-4xl text-[#26384B]/85 tracking-[0.025em] leading-[1.3] mb-10">
                  Professional clinical analysis, handcrafted for your unique physiology.
                </p>
              </Fade>

              <Fade delay={0.8}>
                <div className="flex flex-wrap justify-center gap-4 sm:gap-6 items-center pointer-events-auto">
                  {status === 'authenticated' ? (
                    <>
                      <Link to={user?.role === 'admin' ? '/admin' : '/app'}>
                        <Button
                          variant="primary"
                          size="lg"
                          className="rounded-none px-10 py-5 bg-[#26384B] text-[#F6F4EF] font-mono-tech text-xs tracking-widest shadow-md hover:bg-[#C67C5A] transition-all"
                        >
                          [ GO TO DASHBOARD ]
                        </Button>
                      </Link>
                      <Button
                        variant="secondary"
                        size="lg"
                        onClick={handleLogout}
                        className="rounded-none px-10 py-5 border border-[#26384B]/30 text-[#26384B] font-mono-tech text-xs tracking-widest hover:bg-[#26384B]/5"
                      >
                        [ SIGN OUT ]
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link to="/signup">
                        <Button
                          variant="primary"
                          size="lg"
                          className="rounded-none px-10 py-5 bg-[#26384B] text-[#F6F4EF] font-mono-tech text-xs tracking-widest shadow-md hover:bg-[#C67C5A] transition-all"
                        >
                          [ START CLINICAL ANALYSIS ]
                        </Button>
                      </Link>
                      <a href="#science">
                        <Button
                          variant="secondary"
                          size="lg"
                          className="rounded-none px-10 py-5 border border-[#26384B]/30 bg-[#F6F4EF]/80 text-[#26384B] font-mono-tech text-xs tracking-widest hover:bg-[#26384B]/5"
                        >
                          [ EXPLORE SCIENCE ]
                        </Button>
                      </a>
                    </>
                  )}
                </div>
              </Fade>
            </div>
          </Container>
        </section>

        {/* =========================================================
            2. DRAGONFLY SCROLL VELOCITY TICKER MARQUEE #1
            ========================================================= */}
        <div className="relative z-10">
          <DragonflyMarquee speed={1.0} />
        </div>

        {/* =========================================================
            3. CLINICAL STATS & BENCHMARKS SECTION
            ========================================================= */}
        <div className="relative z-10">
          <StatsSection />
        </div>

        {/* =========================================================
            4. HOW IT WORKS WORKFLOW (3-STEP PROTOCOL)
            ========================================================= */}
        <div className="relative z-10">
          <HowItWorksSection />
        </div>

        {/* =========================================================
            5. THE SCIENCE OF ISHKEEN (HYBRID AI ENGINE)
            ========================================================= */}
        <div className="relative z-10">
          <ClinicalScienceSection />
        </div>

        {/* =========================================================
            6. WHY ISHKEEN (COMPARATIVE ANALYSIS)
            ========================================================= */}
        <div className="relative z-10">
          <ComparisonSection />
        </div>

        {/* =========================================================
            7. DRAGONFLY SCROLL VELOCITY TICKER MARQUEE #2
            ========================================================= */}
        <div className="relative z-10">
          <DragonflyMarquee
            speed={1.4}
            text=" +   99.4% // DIAGNOSTIC_REPEATABILITY   +   FDA_CLASS_I // PROTOCOL_AUDITED   +   43 // ANATOMICAL_LANDMARKS   +   DERMATOLOGIST // VALIDATED_REGIMEN   + "
          />
        </div>

        {/* =========================================================
            8. DERMATOLOGIST & PATIENT TESTIMONIALS
            ========================================================= */}
        <div className="relative z-10">
          <TestimonialsSection />
        </div>

        {/* =========================================================
            9. HIGH-IMPACT FINAL CTA COMMAND CENTER
            ========================================================= */}
        <div className="relative z-10">
          <FinalCtaSection />
        </div>

        {/* =========================================================
            10. FOOTER
            ========================================================= */}
        <div className="relative z-10">
          <Footer />
        </div>
      </div>
    </PageTransition>
  );
};

export default HomePage;
