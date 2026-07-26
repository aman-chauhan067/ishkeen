import React from 'react';
import { Fade, SectionBlurZoom, ScrambleText } from '../motion';
import { DragonflySectionHeader } from './DragonflySectionHeader';

export const TestimonialsSection: React.FC = () => {
  const reviews = [
    {
      code: '01 // DERM_ADVISORY',
      quote:
        'Ishkeen is the first clinical diagnostic tool that accurately captures erythema and lesion distribution without requiring an in-person dermatoscope session.',
      author: 'Dr. Elena Rostova, MD',
      role: 'Clinical Dermatologist & Cosmetic Research Lead',
      badge: 'CLINICAL ADVISOR',
      coord: '[MD // REG_994]',
    },
    {
      code: '02 // FAAD_AUDIT',
      quote:
        'The Fitzpatrick type calibration stopped my patients from over-exfoliating. Seeing the 43-point facial mesh mapping builds immediate diagnostic trust.',
      author: 'Dr. Marcus Vance, FAAD',
      role: 'Board-Certified Dermatologist',
      badge: 'VERIFIED REVIEW',
      coord: '[FAAD // NO_001]',
    },
    {
      code: '03 // CLINICAL_COHORT',
      quote:
        'The morning and evening regimen breakdown gave me exact active concentrations that cleared my cystic breakouts in 6 weeks without barrier burn.',
      author: 'Aria S., Patient Cohort #14',
      role: 'Fitzpatrick Type IV • Acne Prone Profile',
      badge: 'PATIENT RESULT',
      coord: '[COHORT // 14-B]',
    },
  ];

  return (
    <SectionBlurZoom id="reviews" className="relative bg-[#F6F4EF]/75 backdrop-blur-[1px] border-b border-[#26384B]/15">
      {/* Sticky Technical Section Header */}
      <DragonflySectionHeader index="05" title="CLINICAL_ENDORSEMENTS" tag="VALIDATION // PRACTITIONERS" />

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-24">
        <Fade delay={0.05}>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8 border-b border-[#26384B]/15 pb-12">
            <div>
              <span className="font-mono-tech text-xs text-[#C67C5A] block mb-2">
                <ScrambleText text="// SECTION 05: MEDICAL TESTIMONIALS" duration={650} />
              </span>
              <h2 className="font-editorial text-4xl sm:text-6xl md:text-7xl text-[#26384B] tracking-tight max-w-2xl">
                <ScrambleText text="Backed by dermatologists. Proven in practice." duration={850} />
              </h2>
            </div>
            <div className="font-mono-tech text-xs text-[#4C6072]">
              <ScrambleText text="[VERIFIED_REVIEWS // CLINICAL_PRACTITIONERS]" duration={750} />
            </div>
          </div>
        </Fade>

        {/* Architectural 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-l border-t border-[#26384B]/15">
          {reviews.map((rev, idx) => (
            <Fade key={rev.author} delay={0.05 + idx * 0.05}>
              <div className="relative p-8 md:p-12 border-r border-b border-[#26384B]/15 bg-[#F6F4EF] hover:bg-[#26384B]/[0.02] transition-all duration-300 flex flex-col justify-between h-full group">
                {/* Corner Crosshairs */}
                <span className="absolute top-3 right-4 font-mono-tech text-sm text-[#C67C5A]">
                  +
                </span>
                <span className="absolute bottom-3 left-4 font-mono-tech text-[9px] text-[#4C6072]/60">
                  {rev.coord}
                </span>

                <div>
                  <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#26384B]/10">
                    <span className="font-mono-tech text-[10px] text-[#4C6072]">
                      [{rev.code}]
                    </span>
                    <span className="font-mono-tech text-[10px] text-[#C67C5A] uppercase">
                      <ScrambleText text={`[${rev.badge}]`} duration={650} />
                    </span>
                  </div>

                  <p className="font-editorial text-xl md:text-2xl text-[#26384B] leading-relaxed mb-10">
                    &ldquo;<ScrambleText text={rev.quote} duration={900} />&rdquo;
                  </p>
                </div>

                <div className="pt-6 border-t border-[#26384B]/10">
                  <div className="font-editorial text-xl text-[#26384B]">
                    <ScrambleText text={rev.author} duration={750} />
                  </div>
                  <div className="font-mono-tech text-[10px] text-[#4C6072] mt-1">
                    // {rev.role}
                  </div>
                </div>
              </div>
            </Fade>
          ))}
        </div>
      </div>
    </SectionBlurZoom>
  );
};

export default TestimonialsSection;
