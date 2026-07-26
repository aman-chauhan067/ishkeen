import React from 'react';
import { Fade, SectionBlurZoom, ScrambleText } from '../motion';
import { Camera, Cpu, Sparkles } from 'lucide-react';
import { DragonflySectionHeader } from './DragonflySectionHeader';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'OPTICAL MESH SCANNING',
      subtitle: '// 43-POINT GEOMETRIC CALIBRATION',
      description:
        'Using a single high-resolution smartphone selfie, our MediaPipe vision engine maps 43 precise anatomical landmarks across your cheeks, T-zone, and periorbital vectors.',
      icon: Camera,
      tag: 'COMPUTER_VISION',
      coord: '[SYS // CAM_IN]',
    },
    {
      number: '02',
      title: 'HYBRID CLINICAL INFERENCE',
      subtitle: '// MULTI-SPECTRAL AI REASONING',
      description:
        'OpenCV isolates skin tone, erythema, and lipid balance while our deep Gemini clinical vision model evaluates Fitzpatrick phototype, acne severity, and sensitivity.',
      icon: Cpu,
      tag: 'HYBRID_AI_v2.4',
      coord: '[SYS // NEURAL_OP]',
    },
    {
      number: '03',
      title: 'DERMATOLOGICAL FORMULATION',
      subtitle: '// PERSONALIZED AM/PM REGIMEN',
      description:
        'Receive an authoritative, dermatologist-grade routine complete with exact active ingredients, SPF index requirements, and contraindication safety checks.',
      icon: Sparkles,
      tag: 'CLINICAL_GRADE',
      coord: '[SYS // REGIMEN_OUT]',
    },
  ];

  return (
    <SectionBlurZoom id="how-it-works" className="relative bg-[#F6F4EF]/75 backdrop-blur-[1px] border-b border-[#26384B]/15">
      {/* Sticky Technical Section Header */}
      <DragonflySectionHeader index="02" title="DIAGNOSTIC_PROTOCOL" tag="WORKFLOW // 3-STEP_PIPELINE" />

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-24">
        <Fade delay={0.05}>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8 border-b border-[#26384B]/15 pb-12">
            <div>
              <span className="font-mono-tech text-xs text-[#C67C5A] block mb-2">
                <ScrambleText text="// SECTION 02: CLINICAL WORKFLOW" duration={650} />
              </span>
              <h2 className="font-editorial text-4xl sm:text-6xl md:text-7xl text-[#26384B] tracking-[0.025em] leading-[1.2] max-w-2xl">
                <ScrambleText text="Three steps to your definitive clinical skin profile." duration={850} />
              </h2>
            </div>
            <p className="font-sans text-xs sm:text-sm text-[#4C6072] max-w-md leading-relaxed">
              <ScrambleText text="We eliminated subjective questionnaires. Our hybrid vision engine evaluates what your skin actually presents with objective medical precision." duration={800} />
            </p>
          </div>
        </Fade>

        {/* Architectural 3-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 border-l border-t border-[#26384B]/15">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <Fade key={step.number} delay={0.05 + idx * 0.05}>
                <div className="relative p-8 md:p-12 border-r border-b border-[#26384B]/15 bg-[#F6F4EF] hover:bg-[#26384B]/[0.02] transition-all duration-300 flex flex-col justify-between h-full group">
                  {/* Corner Crosshairs */}
                  <span className="absolute top-3 right-4 font-mono-tech text-sm text-[#C67C5A]">
                    +
                  </span>
                  <span className="absolute bottom-3 left-4 font-mono-tech text-[9px] text-[#4C6072]/60">
                    {step.coord}
                  </span>

                  <div>
                    {/* Top index bar */}
                    <div className="flex items-center justify-between mb-10 pb-4 border-b border-[#26384B]/10">
                      <span className="font-editorial text-5xl md:text-6xl text-[#26384B]/25 leading-none">
                        <ScrambleText text={step.number} duration={700} />
                      </span>
                      <span className="font-mono-tech text-[10px] px-2.5 py-1 bg-[#26384B]/5 text-[#26384B]">
                        <ScrambleText text={`[${step.tag}]`} duration={750} />
                      </span>
                    </div>

                    <div className="w-11 h-11 border border-[#26384B] bg-[#26384B] text-[#F6F4EF] flex items-center justify-center mb-8 group-hover:bg-[#C67C5A] group-hover:border-[#C67C5A] transition-all">
                      <Icon size={20} />
                    </div>

                    <h3 className="font-editorial text-3xl text-[#26384B] tracking-[0.02em] mb-2">
                      <ScrambleText text={step.title} duration={850} />
                    </h3>
                    <p className="font-mono-tech text-[10px] text-[#C67C5A] mb-6">
                      <ScrambleText text={step.subtitle} duration={750} />
                    </p>
                    <p className="font-sans text-xs sm:text-sm text-[#26384B]/80 leading-relaxed">
                      <ScrambleText text={step.description} duration={900} />
                    </p>
                  </div>

                  {/* Footer status bar */}
                  <div className="mt-12 pt-4 border-t border-[#26384B]/10 flex items-center justify-between font-mono-tech text-[10px] text-[#4C6072]">
                    <span>[ STEP // {step.number} OF 03 ]</span>
                    <span className="group-hover:translate-x-2 transition-transform text-[#26384B]">➔</span>
                  </div>
                </div>
              </Fade>
            );
          })}
        </div>
      </div>
    </SectionBlurZoom>
  );
};

export default HowItWorksSection;
