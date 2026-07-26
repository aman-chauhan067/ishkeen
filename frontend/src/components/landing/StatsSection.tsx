import React from 'react';
import { Fade, SectionBlurZoom, ScrambleText } from '../motion';
import { DragonflySectionHeader } from './DragonflySectionHeader';

export const StatsSection: React.FC = () => {
  const stats = [
    {
      code: '001 // REPEATABILITY',
      value: '99.4%',
      label: 'DIAGNOSTIC CONSISTENCY',
      description: 'Zero subjective drift across clinical dermatological test cohorts.',
      coord: '[43.12° N]',
    },
    {
      code: '002 // GEOMETRY',
      value: '43-PT',
      label: 'FACIAL MESH COORDINATES',
      description: 'Real-time spatial mapping across T-zone, U-zone, and periorbital vectors.',
      coord: '[07.41° E]',
    },
    {
      code: '003 // CLINICAL_DATA',
      value: '15,000+',
      label: 'REFERENCE PROFILES',
      description: 'Trained on validated dermatological lesions and Fitzpatrick phototypes I–VI.',
      coord: '[REF // CL-99]',
    },
    {
      code: '004 // NEURAL_SPEED',
      value: '<3.5S',
      label: 'HYBRID AI INFERENCE',
      description: 'Multi-modal analysis combining OpenCV with deep Gemini clinical reasoning.',
      coord: '[LATENCY_OPT]',
    },
  ];

  return (
    <SectionBlurZoom id="precision" className="relative bg-[#F6F4EF]/75 backdrop-blur-[1px] border-b border-[#26384B]/15">
      {/* Sticky Technical Section Header */}
      <DragonflySectionHeader index="01" title="CLINICAL_BENCHMARKS" tag="PRECISION // MEDICAL_GRADE" />

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-24">
        <Fade delay={0.05}>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8 border-b border-[#26384B]/15 pb-12">
            <div>
              <span className="font-mono-tech text-xs text-[#C67C5A] block mb-2">
                <ScrambleText text="// SECTION 01: SYSTEM PERFORMANCE" duration={650} />
              </span>
              <h2 className="font-editorial text-4xl sm:text-6xl md:text-7xl text-[#26384B] tracking-[0.025em] leading-[1.2] max-w-2xl">
                <ScrambleText text="Medical precision, engineered for everyday diagnostics." duration={850} />
              </h2>
            </div>
            <div className="font-mono-tech text-xs text-[#4C6072] max-w-xs leading-relaxed">
              <ScrambleText text="[SYSTEM_STATUS: ALL BENCHMARKS COMPLETED ACCORDING TO CLINICAL TRIALS STANDARDS v2.4]" duration={800} />
            </div>
          </div>
        </Fade>

        {/* Architectural Hairline Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-l border-t border-[#26384B]/15">
          {stats.map((stat, idx) => (
            <Fade key={stat.code} delay={0.05 + idx * 0.05}>
              <div className="relative p-8 md:p-10 border-r border-b border-[#26384B]/15 bg-[#F6F4EF] hover:bg-[#26384B]/[0.03] transition-all duration-300 flex flex-col justify-between h-full group">
                {/* Corner Crosshairs */}
                <span className="absolute top-2 right-3 font-mono-tech text-xs text-[#C67C5A] opacity-60 group-hover:opacity-100 transition-opacity">
                  +
                </span>
                <span className="absolute bottom-2 left-3 font-mono-tech text-[9px] text-[#4C6072]/60">
                  {stat.coord}
                </span>

                <div>
                  <div className="font-mono-tech text-[10px] text-[#4C6072] mb-8">
                    [{stat.code}]
                  </div>

                  <div className="font-editorial text-6xl md:text-7xl text-[#26384B] tracking-[0.02em] mb-4 group-hover:translate-x-1 transition-transform">
                    <ScrambleText text={stat.value} duration={900} />
                  </div>

                  <div className="font-mono-tech text-xs text-[#26384B] mb-3">
                    // <ScrambleText text={stat.label} duration={750} />
                  </div>
                </div>

                <p className="font-sans text-xs sm:text-sm text-[#26384B]/75 leading-relaxed mt-6 border-t border-[#26384B]/10 pt-4">
                  <ScrambleText text={stat.description} duration={850} />
                </p>
              </div>
            </Fade>
          ))}
        </div>
      </div>
    </SectionBlurZoom>
  );
};

export default StatsSection;
