import React from 'react';
import { cn } from '../../lib/cn';

interface AmbientGlowProps {
  className?: string;
  trigger?: 'group-hover' | 'group-focus-within' | 'always';
  blur?: string;      // default: blur-[120px]
  opacity?: string;   // default: opacity-0 group-hover:opacity-[0.14]
  scale?: string;     // default: scale-95 group-hover:scale-108
  duration?: string;  // default: duration-[600ms]
}

export const AmbientGlow: React.FC<AmbientGlowProps> = ({
  className,
  trigger = 'group-hover',
  blur = 'blur-[140px]',
  opacity = 'opacity-0 group-hover:opacity-10',
  scale = 'scale-95 group-hover:scale-100',
  duration = 'duration-500',
}) => {
  // If focus-within is needed:
  // If focus-within is needed:
  const triggerOpacity = trigger === 'group-focus-within' ? 'opacity-0 group-focus-within:opacity-10' : opacity;
  const triggerScale = trigger === 'group-focus-within' ? 'scale-95 group-focus-within:scale-100' : scale;
  const triggerAlways = trigger === 'always' ? 'opacity-10 scale-100' : '';

  const activeOpacity = trigger === 'always' ? triggerAlways : triggerOpacity;
  const activeScale = trigger === 'always' ? '' : triggerScale;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute inset-0 z-[-1] pointer-events-none rounded-[inherit]",
        "transition-all ease-[var(--luxury-ease)] will-change-transform",
        blur,
        duration,
        activeOpacity,
        activeScale,
        className
      )}
      style={{
        // A soft, painterly mix of Ocean Blue (#5C7E9A), Soft Sage (#A8B5A2), and Peach (#F4D3C4)
        background: 'radial-gradient(ellipse at 50% 50%, #5C7E9A 0%, #A8B5A2 50%, #F4D3C4 100%)',
        // Expand the glow area enormously outside the boundary
        margin: '-60px',
      }}
    />
  );
};
