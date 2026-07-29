import React, { useState } from 'react';
import { Fade, SectionBlurZoom, ScrambleText } from '../motion';
import { ShieldCheck, Activity, Sun, Droplets } from 'lucide-react';
import { DragonflySectionHeader } from './DragonflySectionHeader';

export const ClinicalScienceSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const features = [
    {
      id: 'full_spectrum',
      code: '01 // CLINICAL_CONCERNS_18',
      icon: Activity,
      title: '18-Concern Full-Spectrum Clinical Grading',
      subtitle: '// ACNE, ROSACEA, MELASMA, WRINKLES & BARRIER STRATIFICATION',
      description:
        'Our hybrid computer vision and neural vision pipeline classifies 18 distinct dermatological conditions—including acne lesions, rosacea flushing, melasma pigmentation, fine lines, and moisture barrier integrity across 43 anatomical facial zones.',
      stats: [
        { label: 'CONCERNS_MAPPED', value: '18_CONDITIONS' },
        { label: 'ZONES_MAPPED', value: '43_PTS' },
      ],
      badge: 'FDA_CLASS_I // COMPLIANT',
    },
    {
      id: 'fitzpatrick',
      code: '02 // FITZPATRICK_SCALE',
      icon: Sun,
      title: 'Fitzpatrick Phototype Calibration',
      subtitle: '// MELANIN DENSITY & UV RISK PROFILING',
      description:
        'Accurately classifies skin types across Fitzpatrick scale I through VI. This prevents post-inflammatory hyperpigmentation (PIH) risks when prescribing active exfoliants like glycolic acid or retinoids.',
      stats: [
        { label: 'RESOLUTION', value: 'TYPE_I–VI' },
        { label: 'UV_CALIBRATION', value: 'REAL_TIME' },
      ],
      badge: 'CLINICAL_DERM // VALIDATED',
    },
    {
      id: 'sebum_tewl',
      code: '03 // LIPID_TEWL_PROFILING',
      icon: Droplets,
      title: 'Lipid Mantle & Dehydration Profiling',
      subtitle: '// SEBUM vs. TRANS-EPIDERMAL WATER LOSS (TEWL)',
      description:
        'By analyzing specular highlights and colorimetric shifts across cheeks and forehead, Ishkeen quantifies regional lipid secretion to differentiate true oily skin from dehydrated barrier compensation and rosacea vascularity.',
      stats: [
        { label: 'SPECULAR_MAP', value: 'SUB_MM' },
        { label: 'BARRIER_INDEX', value: '0.01_PRECISION' },
      ],
      badge: 'MULTI_SPECTRAL // OPENCV',
    },
    {
      id: 'safety',
      code: '04 // PHARMA_SAFETY',
      icon: ShieldCheck,
      title: 'Dermatological Safety & SPF Matrix',
      subtitle: '// AUTOMATED CONTRAINDICATION PROTOCOLS',
      description:
        'Every recommended regimen undergoes automatic pharmacological cross-checking to ensure incompatible actives (such as Vitamin C with AHA/BHA or Retinol) are never paired without proper temporal spacing.',
      stats: [
        { label: 'SAFETY_RULES', value: '240+_PROTOCOLS' },
        { label: 'SPF_RANGE', value: 'SPF_30–50+' },
      ],
      badge: 'CLINICIAN // CERTIFIED',
    },
  ];

  const current = features[activeTab];

  return (
    <SectionBlurZoom id="science" className="relative bg-[#F6F4EF]/75 backdrop-blur-[1px] border-b border-[#26384B]/15">
      {/* Sticky Technical Section Header */}
      <DragonflySectionHeader index="03" title="CLINICAL_INTELLIGENCE" tag="SCIENCE // NEURAL_ENGINE" />

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-24">
        <Fade delay={0.05}>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8 border-b border-[#26384B]/15 pb-12">
            <div>
              <span className="font-mono-tech text-xs text-[#C67C5A] block mb-2">
                <ScrambleText text="// SECTION 03: HYBRID AI ENGINE" duration={650} />
              </span>
              <h2 className="font-editorial text-4xl sm:text-6xl md:text-7xl text-[#26384B] tracking-tight max-w-2xl">
                <ScrambleText text="Clinical dermatology powered by hybrid machine intelligence." duration={850} />
              </h2>
            </div>
            <div className="font-mono-tech text-xs text-[#4C6072]">
              <ScrambleText text="[ENGINE: OPENCV_CV + GEMINI_1.5_VISION // LATENCY < 3.5S]" duration={800} />
            </div>
          </div>
        </Fade>

        {/* Technical Monospace Selector Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#26384B]/15 mb-12">
          {features.map((feat, idx) => {
            const isActive = activeTab === idx;
            return (
              <button
                key={feat.id}
                onClick={() => setActiveTab(idx)}
                className={`p-5 text-left transition-all border-r border-[#26384B]/15 last:border-r-0 ${
                  isActive
                    ? 'bg-[#26384B] text-[#F6F4EF]'
                    : 'bg-[#F6F4EF] text-[#26384B] hover:bg-[#26384B]/5'
                }`}
              >
                <div className="font-mono-tech text-[10px] mb-2 opacity-75">
                  [{feat.code}]
                </div>
                <div className="font-editorial text-xl leading-tight">
                  <ScrambleText text={feat.title} duration={750} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Feature Showcase Technical Panel */}
        <Fade key={current.id} delay={0.05}>
          <div className="border border-[#26384B]/15 bg-[#F6F4EF] grid grid-cols-1 lg:grid-cols-12 relative overflow-hidden">
            {/* Left Description Column */}
            <div className="lg:col-span-7 p-8 md:p-14 border-b lg:border-b-0 lg:border-r border-[#26384B]/15 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <span className="font-mono-tech text-[10px] px-3 py-1 border border-[#26384B]/25 text-[#26384B]">
                    <ScrambleText text={`[${current.badge}]`} duration={700} />
                  </span>
                  <span className="font-mono-tech text-xs text-[#C67C5A]">+</span>
                </div>

                <h3 className="font-editorial text-4xl sm:text-5xl text-[#26384B] tracking-tight mb-4">
                  <ScrambleText text={current.title} duration={850} />
                </h3>
                <p className="font-mono-tech text-xs text-[#C67C5A] mb-6">
                  <ScrambleText text={current.subtitle} duration={750} />
                </p>
                <p className="font-sans text-sm sm:text-base text-[#26384B]/80 leading-relaxed mb-10">
                  <ScrambleText text={current.description} duration={900} />
                </p>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-[#26384B]/15">
                {current.stats.map((st) => (
                  <div key={st.label}>
                    <div className="font-editorial text-4xl sm:text-5xl text-[#26384B]">
                      <ScrambleText text={st.value} duration={750} />
                    </div>
                    <div className="font-mono-tech text-[10px] text-[#4C6072] mt-2">
                      // {st.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Visual Technical Telemetry Panel */}
            <div className="lg:col-span-5 bg-[#26384B] text-[#F6F4EF] p-8 md:p-14 flex flex-col items-center justify-center relative group">
              <div className="absolute top-4 right-4 font-mono-tech text-[10px] text-[#F6F4EF]/40">
                [SYS // HYBRID_CV_ENGINE]
              </div>
              <div className="absolute top-4 left-4 font-mono-tech text-[10px] text-[#C67C5A]">
                +
              </div>

              <div className="w-24 h-24 border border-[#F6F4EF]/30 bg-[#F6F4EF]/10 text-[#F6F4EF] flex items-center justify-center mb-8 group-hover:border-[#C67C5A] group-hover:text-[#C67C5A] transition-all">
                <current.icon size={44} />
              </div>

              <div className="text-center">
                <div className="font-mono-tech text-xs text-[#C67C5A] tracking-widest mb-3">
                  <ScrambleText text={`[${current.id.toUpperCase()}_MODEL // OPERATIONAL]`} duration={750} />
                </div>
                <p className="font-mono-tech text-[11px] text-[#F6F4EF]/70 max-w-xs leading-relaxed">
                  <ScrambleText text="Real-time neural inference verified by dermatological formulation constraints." duration={850} />
                </p>
              </div>

              {/* Technical bottom coordinates */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between font-mono-tech text-[9px] text-[#F6F4EF]/40">
                <span>[MESH_RES: 43_LANDMARKS]</span>
                <span>[FP_TYPE: CALIBRATED]</span>
              </div>
            </div>
          </div>
        </Fade>
      </div>
    </SectionBlurZoom>
  );
};

export default ClinicalScienceSection;
