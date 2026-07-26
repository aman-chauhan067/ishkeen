import React from 'react';
import { Typography } from '../../../components/ui/Typography';
import { PageTransition, BlurReveal, Fade } from '../../../components/motion';

export const QuestionTransition = PageTransition;

export const QuestionSection: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <section className={`space-y-16 py-8 ${className}`}>
    {children}
  </section>
);

export const QuestionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BlurReveal>
    <p
      className="font-black text-[#26384B] mb-3"
      style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', lineHeight: 1.1 }}
    >
      {children}
    </p>
  </BlurReveal>
);

export const QuestionDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Fade delay={0.1}>
    <Typography variant="body" className="opacity-80 max-w-lg mb-8 text-base leading-relaxed">
      {children}
    </Typography>
  </Fade>
);

export const QuestionHint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography variant="caption" className="text-sm opacity-50 uppercase tracking-wider font-semibold">
    {children}
  </Typography>
);

export const StepDivider: React.FC = () => (
  <div className="h-px bg-white/10 w-full my-12" />
);

export const QuestionFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col sm:flex-row gap-4 mt-12 pt-8 border-t border-white/10">
    {children}
  </div>
);
