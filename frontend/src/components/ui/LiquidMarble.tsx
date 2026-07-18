import React from 'react';
import { cn } from '../../lib/cn';

export const LiquidMarble: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("fixed inset-0 overflow-hidden pointer-events-none z-0", className)}>
      {/* Base Canvas */}
      <div className="absolute inset-0 bg-background" />

      {/* 
        The SVG defining the liquid marble displacement filter and paper texture 
      */}
      <svg className="hidden">
        <defs>
          <filter id="liquid-marble" x="-20%" y="-20%" width="140%" height="140%">
            {/* Extremely low frequency turbulence for large organic movement */}
            <feTurbulence type="fractalNoise" baseFrequency="0.003 0.005" numOctaves="3" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -5" in="noise" result="coloredNoise" />
            <feDisplacementMap in="SourceGraphic" in2="coloredNoise" scale="150" xChannelSelector="R" yChannelSelector="G" result="displaced" />
            
            {/* Extra blur after displacement to simulate wet watercolor bleed */}
            <feGaussianBlur in="displaced" stdDeviation="30" result="blurred" />
            <feMerge>
              <feMergeNode in="blurred" />
            </feMerge>
          </filter>

          <filter id="paper-texture" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="4" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.05 0" />
          </filter>
        </defs>
      </svg>

      {/* Container for the liquid simulation (animated slowly over 5 minutes) */}
      <div className="absolute inset-[-50%] w-[200%] h-[200%] animate-liquid-drift">
        <div 
          className="absolute inset-0 w-full h-full"
          style={{ filter: 'url(#liquid-marble)' }}
        >
          {/* 
            Organic paths emitting from edges. 
            Coverage increased to 35-40%.
            Animated pigments slowly cycle through the luxury palette over 240s - 300s.
          */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full opacity-[0.85] mix-blend-multiply">
            {/* Massive flow from top left */}
            <path d="M0,0 Q40,15 30,55 T0,90 Z" className="animate-pigment-1" opacity="0.6" />
            
            {/* Deep wash from bottom right stretching to center */}
            <path d="M100,100 Q50,85 70,35 T100,0 Z" className="animate-pigment-2" opacity="0.6" />

            {/* Soft bleed from bottom left */}
            <path d="M0,100 Q45,95 25,45 T0,10 Z" className="animate-pigment-3" opacity="0.5" />
            
            {/* Secondary sweeping ribbon top right */}
            <path d="M100,0 Q55,20 85,60 T100,80 Z" className="animate-pigment-1" opacity="0.4" style={{ animationDelay: '-120s' }} />
          </svg>
        </div>
      </div>

      {/* Handmade Paper Texture Overlay */}
      <div className="absolute inset-0 pointer-events-none mix-blend-overlay animate-texture-drift opacity-80">
        <div className="w-full h-full" style={{ filter: 'url(#paper-texture)' }} />
      </div>
    </div>
  );
};
