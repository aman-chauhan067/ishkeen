import React from 'react';
import { Fade, SectionBlurZoom, ScrambleText } from '../motion';
import { Check, X } from 'lucide-react';
import { DragonflySectionHeader } from './DragonflySectionHeader';

export const ComparisonSection: React.FC = () => {
  const comparisonItems = [
    {
      code: '01 // INPUT_MODE',
      feature: 'Diagnostic Input Method',
      ishkeen: '43-Point Facial Mesh + Computer Vision Selfie Analysis',
      others: 'Subjective 5-minute self-reported quiz',
    },
    {
      code: '02 // LESIONS',
      feature: 'Acne Severity Grading',
      ishkeen: 'Objective Lesion Density & Erythema Quantification',
      others: 'User guesses ("mild, moderate, or severe")',
    },
    {
      code: '03 // PHOTOTYPING',
      feature: 'Fitzpatrick Phototyping',
      ishkeen: 'Automated Multi-Spectral Melanin Density Check',
      others: 'Self-reported sun burn history',
    },
    {
      code: '04 // CONTRAINDICATIONS',
      feature: 'Ingredient Contraindication Checks',
      ishkeen: '240+ Automated Pharmacological Safety Rules',
      others: 'Generic product bundle recommendations',
    },
    {
      code: '05 // FORMULATION',
      feature: 'Formulation Transparency',
      ishkeen: 'Exact active ingredient concentrations & AM/PM slots',
      others: 'Proprietary hidden cream formulas',
    },
  ];

  return (
    <SectionBlurZoom id="comparison" className="relative bg-[#F6F4EF]/75 backdrop-blur-[1px] border-b border-[#26384B]/15">
      {/* Sticky Technical Section Header */}
      <DragonflySectionHeader index="04" title="CLINICAL_VALIDATION" tag="COMPARISON // MEDICAL_GRADE_VS_QUIZZES" />

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-24">
        <Fade delay={0.05}>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8 border-b border-[#26384B]/15 pb-12">
            <div>
              <span className="font-mono-tech text-xs text-[#C67C5A] block mb-2">
                <ScrambleText text="// SECTION 04: COMPARATIVE ANALYSIS" duration={650} />
              </span>
              <h2 className="font-editorial text-4xl sm:text-6xl md:text-7xl text-[#26384B] tracking-tight max-w-2xl">
                <ScrambleText text="Medical-grade vision vs. guesswork quizzes." duration={850} />
              </h2>
            </div>
            <div className="font-mono-tech text-xs text-[#4C6072]">
              <ScrambleText text="[AUDIT // DERMATOLOGY_VS_ALGORITHMIC_QUIZZES]" duration={750} />
            </div>
          </div>
        </Fade>

        {/* Architectural Grid Table */}
        <Fade delay={0.1}>
          <div className="border border-[#26384B]/15 bg-[#F6F4EF] overflow-hidden">
            {/* Header Row */}
            <div className="grid grid-cols-12 bg-[#26384B] text-[#F6F4EF] py-5 px-6 md:px-10 font-mono-tech text-xs border-b border-[#26384B]/15">
              <div className="col-span-5 md:col-span-4">
                <ScrambleText text="[ CLINICAL PARAMETER ]" duration={700} />
              </div>
              <div className="col-span-4 md:col-span-4 text-center text-[#C67C5A]">
                <ScrambleText text="[ ISHKEEN HYBRID AI ]" duration={750} />
              </div>
              <div className="col-span-3 md:col-span-4 text-center text-[#F6F4EF]/60">
                <ScrambleText text="[ STANDARD QUIZZES ]" duration={750} />
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-[#26384B]/15">
              {comparisonItems.map((item) => (
                <div
                  key={item.feature}
                  className="grid grid-cols-12 py-6 px-6 md:px-10 items-center hover:bg-[#26384B]/[0.02] transition-colors group"
                >
                  <div className="col-span-5 md:col-span-4">
                    <div className="font-mono-tech text-[10px] text-[#4C6072] mb-1">
                      {item.code}
                    </div>
                    <div className="font-editorial text-lg md:text-xl text-[#26384B] leading-tight">
                      <ScrambleText text={item.feature} duration={800} />
                    </div>
                  </div>

                  <div className="col-span-4 md:col-span-4 flex items-start justify-center gap-2.5 text-center px-4">
                    <Check size={18} className="text-[#C67C5A] shrink-0 mt-0.5" />
                    <span className="font-sans text-xs md:text-sm font-bold text-[#26384B]">
                      <ScrambleText text={item.ishkeen} duration={850} />
                    </span>
                  </div>

                  <div className="col-span-3 md:col-span-4 flex items-start justify-center gap-2.5 text-center px-4">
                    <X size={18} className="text-[#4C6072] shrink-0 mt-0.5" />
                    <span className="font-sans text-xs md:text-sm text-[#4C6072]">
                      <ScrambleText text={item.others} duration={850} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Fade>
      </div>
    </SectionBlurZoom>
  );
};

export default ComparisonSection;
