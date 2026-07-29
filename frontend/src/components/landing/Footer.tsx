import React from 'react';
import { Link } from 'react-router-dom';
import { DragonflyLogo } from '../ui/DragonflyLogo';
import { SectionBlurZoom, ScrambleText } from '../motion';

export const Footer: React.FC = () => {
  return (
    <SectionBlurZoom id="footer" className="bg-[#26384B] text-[#F6F4EF] border-t border-[#F6F4EF]/15 relative overflow-hidden">
      {/* Corner crosshairs */}
      <span className="absolute top-4 left-6 font-mono-tech text-xs text-[#C67C5A]">+</span>
      <span className="absolute top-4 right-6 font-mono-tech text-xs text-[#C67C5A]">+</span>

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-[#F6F4EF]/15">
          {/* Brand Col */}
          <div className="md:col-span-5">
            <Link to="/" className="inline-block mb-6">
              <DragonflyLogo size="lg" variant="light" showSubtitle={false} />
            </Link>

            <p className="font-sans text-xs md:text-sm text-[#F6F4EF]/70 max-w-sm leading-relaxed mb-8">
              <ScrambleText text="Professional clinical skincare diagnostics powered by MediaPipe facial mesh mapping and Gemini neural reasoning." duration={850} />
            </p>

            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 border border-[#F6F4EF]/20 font-mono-tech text-[10px] text-[#F6F4EF]/80">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span><ScrambleText text="SYS // ALL DIAGNOSTIC PIPELINES OPERATIONAL" duration={700} /></span>
            </div>
          </div>

          {/* Navigation links */}
          <div className="md:col-span-2">
            <h4 className="font-mono-tech text-[10px] tracking-widest text-[#C67C5A] mb-6">
              <ScrambleText text="// PLATFORM" duration={600} />
            </h4>
            <ul className="space-y-3 font-mono-tech text-xs text-[#F6F4EF]/80">
              <li><a href="#how-it-works" className="hover:text-[#C67C5A] transition-colors"><ScrambleText text="/01_HOW_IT_WORKS" duration={700} /></a></li>
              <li><a href="#science" className="hover:text-[#C67C5A] transition-colors"><ScrambleText text="/02_CLINICAL_AI" duration={750} /></a></li>
              <li><a href="#precision" className="hover:text-[#C67C5A] transition-colors"><ScrambleText text="/03_BENCHMARKS" duration={800} /></a></li>
              <li><a href="#comparison" className="hover:text-[#C67C5A] transition-colors"><ScrambleText text="/04_WHY_ISHKEEN" duration={850} /></a></li>
              <li><a href="#reviews" className="hover:text-[#C67C5A] transition-colors"><ScrambleText text="/05_REVIEWS" duration={850} /></a></li>
            </ul>
          </div>

          {/* Clinical Links */}
          <div className="md:col-span-2">
            <h4 className="font-mono-tech text-[10px] tracking-widest text-[#C67C5A] mb-6">
              <ScrambleText text="// SCIENCE" duration={600} />
            </h4>
            <ul className="space-y-3 font-mono-tech text-xs text-[#F6F4EF]/80">
              <li><a href="#science" className="hover:text-[#C67C5A] transition-colors"><ScrambleText text="/MEDIAPIPE_MESH" duration={750} /></a></li>
              <li><a href="#science" className="hover:text-[#C67C5A] transition-colors"><ScrambleText text="/FITZPATRICK_SCALE" duration={800} /></a></li>
              <li><a href="#science" className="hover:text-[#C67C5A] transition-colors"><ScrambleText text="/18_CONCERN_GRADING_API" duration={850} /></a></li>
              <li><a href="#science" className="hover:text-[#C67C5A] transition-colors"><ScrambleText text="/PHARMACOVIGILANCE" duration={850} /></a></li>
            </ul>
          </div>

          {/* Legal / Medical Disclaimer */}
          <div className="md:col-span-3">
            <h4 className="font-mono-tech text-[10px] tracking-widest text-[#C67C5A] mb-6">
              <ScrambleText text="// MEDICAL_DISCLAIMER" duration={650} />
            </h4>
            <p className="font-mono-tech text-[10px] text-[#F6F4EF]/60 leading-relaxed uppercase">
              <ScrambleText text="[NOTICE]: ISHKEEN CLINICAL AI v2.4 PROVIDES DIAGNOSTIC DECISION SUPPORT AND REGIMEN FORMULATION. CONSULT A LICENSED DERMATOLOGIST FOR CLINICAL PROCEDURES OR SYSTEMIC PRESCRIPTION THERAPY." duration={950} />
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between font-mono-tech text-[10px] text-[#F6F4EF]/60 gap-4">
          <div>
            &copy; {new Date().getFullYear()} <ScrambleText text="ISHKEEN DIAGNOSTIC SYSTEMS INC. // ALL RIGHTS RESERVED." duration={800} />
          </div>
          <div className="flex gap-6">
            <span className="hover:text-white cursor-pointer transition-colors"><ScrambleText text="[PRIVACY_POLICY]" duration={700} /></span>
            <span className="hover:text-white cursor-pointer transition-colors"><ScrambleText text="[TERMS_OF_SERVICE]" duration={750} /></span>
            <span className="hover:text-white cursor-pointer transition-colors"><ScrambleText text="[HIPAA_COMPLIANCE]" duration={800} /></span>
          </div>
        </div>
      </div>
    </SectionBlurZoom>
  );
};

export default Footer;
