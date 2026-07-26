import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Fade, SectionBlurZoom, ScrambleText } from '../motion';
import { DragonflySectionHeader } from './DragonflySectionHeader';

export const FinalCtaSection: React.FC = () => {
  return (
    <SectionBlurZoom id="initiate" className="relative bg-[#F6F4EF]/75 backdrop-blur-[1px] border-b border-[#26384B]/15">
      {/* Sticky Technical Section Header */}
      <DragonflySectionHeader index="06" title="DIAGNOSTIC_INITIATION" tag="SESSION // INSTANT_AI_SCAN" />

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-24">
        {/* Architectural 2-Column Command Center Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 border-l border-t border-r border-b border-[#26384B]/15 bg-[#F6F4EF] overflow-hidden">
          {/* Left Column: Monumental Editorial Invitation */}
          <div className="lg:col-span-7 p-8 md:p-14 border-b lg:border-b-0 lg:border-r border-[#26384B]/15 flex flex-col justify-between relative group">
            {/* Corner Crosshairs */}
            <span className="absolute top-4 left-4 font-mono-tech text-xs text-[#C67C5A]">+</span>
            <span className="absolute top-4 right-4 font-mono-tech text-xs text-[#C67C5A]">+</span>
            <span className="absolute bottom-4 left-4 font-mono-tech text-[9px] text-[#4C6072]/60">
              [LAT // 43.119° N -- SYSTEM_INIT_01]
            </span>

            <div>
              <div className="flex items-center gap-2 mb-8">
                <span className="w-2 h-2 bg-[#C67C5A] animate-pulse" />
                <span className="font-mono-tech text-xs text-[#C67C5A] uppercase tracking-widest">
                  <ScrambleText text="[ STEP 01 // LAUNCH OPTICAL SCAN ]" duration={650} />
                </span>
              </div>

              <Fade delay={0.05}>
                <h2 className="font-editorial text-4xl sm:text-6xl md:text-7xl text-[#26384B] tracking-[0.03em] leading-[1.05] mb-8">
                  <ScrambleText text="Begin your clinical diagnostic." duration={850} />
                </h2>
              </Fade>

              <Fade delay={0.1}>
                <p className="font-sans text-sm md:text-base text-[#26384B]/80 leading-relaxed max-w-xl mb-12">
                  <ScrambleText text="No generic questionnaires. No guesswork. Experience objective 43-point MediaPipe facial mesh mapping and dermatologist-validated regimen formulation in under 4 seconds." duration={900} />
                </p>
              </Fade>
            </div>

            <Fade delay={0.15}>
              <div className="flex flex-wrap items-center gap-5 pt-8 border-t border-[#26384B]/10">
                <Link to="/signup">
                  <Button
                    variant="primary"
                    size="lg"
                    className="rounded-none px-12 py-6 bg-[#26384B] text-[#F6F4EF] font-mono-tech text-xs tracking-widest shadow-xl hover:bg-[#C67C5A] hover:text-[#F6F4EF] transition-all"
                  >
                    <ScrambleText text="[ START CLINICAL SCAN NOW ➔ ]" duration={750} />
                  </Button>
                </Link>
                <a href="#science">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="rounded-none px-8 py-6 border border-[#26384B]/30 bg-transparent text-[#26384B] font-mono-tech text-xs tracking-widest hover:bg-[#26384B]/5 transition-all"
                  >
                    <ScrambleText text="[ EXPLORE PROTOCOL ]" duration={700} />
                  </Button>
                </a>
              </div>
            </Fade>
          </div>

          {/* Right Column: Live Clinical Diagnostics Telemetry HUD Card */}
          <div className="lg:col-span-5 bg-[#26384B] text-[#F6F4EF] p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
            {/* Corner Crosshairs */}
            <span className="absolute top-4 right-4 font-mono-tech text-xs text-[#C67C5A]">+</span>
            <span className="absolute bottom-4 right-4 font-mono-tech text-xs text-[#C67C5A]">+</span>

            {/* Top Telemetry Header Bar */}
            <div>
              <div className="flex items-center justify-between pb-6 mb-8 border-b border-[#F6F4EF]/15 font-mono-tech text-[10px] text-[#F6F4EF]/80">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span><ScrambleText text="[ OPTICAL_LENS: ONLINE ]" duration={600} /></span>
                </div>
                <span><ScrambleText text="60.0 FPS // 4.2ms" duration={700} /></span>
              </div>

              {/* Simulated Terminal HUD Display */}
              <div className="font-mono-tech text-xs space-y-5 bg-[#F6F4EF]/5 border border-[#F6F4EF]/10 p-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#F6F4EF]/10">
                  <span className="text-[#C67C5A]"><ScrambleText text="[01] ERYTHEMA DETECTION" duration={700} /></span>
                  <span className="text-emerald-400 font-bold">[ READY ]</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-[#F6F4EF]/10">
                  <span className="text-[#F6F4EF]/90"><ScrambleText text="[02] SEBUM & HYDRATION" duration={750} /></span>
                  <span className="text-[#F6F4EF]/70">■■■■■■■■ 99.4%</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-[#F6F4EF]/10">
                  <span className="text-[#F6F4EF]/90"><ScrambleText text="[03] FITZPATRICK TYPE IV" duration={750} /></span>
                  <span className="text-[#C67C5A]">[ AUTO-DETECT ]</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#F6F4EF]/90"><ScrambleText text="[04] REGIMEN COMPATIBILITY" duration={800} /></span>
                  <span className="text-emerald-400 font-bold">[ VERIFIED ]</span>
                </div>
              </div>

              {/* ASCII Medical Mesh Target Graph */}
              <div className="mt-8 font-mono-tech text-[10px] text-[#F6F4EF]/60 bg-[#203240] p-4 border border-[#F6F4EF]/10 select-none">
                <div className="flex justify-between text-[#C67C5A] mb-2">
                  <span>// LANDMARK_ALIGNMENT</span>
                  <span>[43 / 43 ACTIVE]</span>
                </div>
                <pre className="text-[9px] leading-[1.3] text-[#F6F4EF]/50 overflow-x-auto">
{`+----+--------------------------------+----+
|  O |   *   o   .       .   o   *    |  O |
| -- | .   #   *   F A C E   *   #  . | -- |
|  O |   *   o   .   M E S H   o   *  |  O |
+----+--------------------------------+----+`}
                </pre>
              </div>
            </div>

            {/* Bottom HUD Signature */}
            <div className="pt-8 border-t border-[#F6F4EF]/15 mt-8 font-mono-tech text-[9px] text-[#F6F4EF]/60 uppercase tracking-wider flex items-center justify-between">
              <span>[ HIPAA_COMPLIANT // ZERO RETENTION ]</span>
              <span className="text-[#C67C5A]">[ AI_v2.4 ]</span>
            </div>
          </div>
        </div>
      </div>
    </SectionBlurZoom>
  );
};

export default FinalCtaSection;
