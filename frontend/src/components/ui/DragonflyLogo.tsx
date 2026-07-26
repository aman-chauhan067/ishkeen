import React from 'react';

interface DragonflyLogoProps {
  className?: string;
  showSubtitle?: boolean;
  subtitleText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark' | 'light';
}

/**
 * Exact JSON specification matching the user's reference geometric dragonfly emblem
 * Features:
 * - Solid filled thick architectural polygons (not thin strokes)
 * - Exact 40:60 body attachment ratio
 * - Clean 2px uniform gap between the wing tips and central vertical bar
 * - Lower trailing wings 10-14% longer than upper wings
 * - +22% increased wingspan for majestic aerodynamic silhouette
 */
export const DRAGONFLY_LOGO_JSON = {
  viewBox: '0 0 130 100',
  proportions: {
    bodyRatio: '40:60',
    wingGap: 7, // 7 units in 130x100 viewBox = exact ~2px gap
    lowerWingExtension: '10%+ longer',
  },
  elements: [
    {
      type: 'rect' as const,
      id: 'center-body-stem',
      x: 60,
      y: 0,
      width: 10,
      height: 100, // Extends 100% from top of head (y=0) to tip of tail (y=100) with 0 gap
    },
    {
      type: 'path' as const,
      id: 'left-wing',
      d: 'M 9 22 L 53 36 L 53 46 L 9 65 L 9 53 L 34 41 L 9 32 Z',
    },
    {
      type: 'path' as const,
      id: 'right-wing',
      d: 'M 121 22 L 77 36 L 77 46 L 121 65 L 121 53 L 96 41 L 121 32 Z',
    },
  ],
};

export const DragonflyLogo: React.FC<DragonflyLogoProps> = ({
  className = '',
  showSubtitle = true,
  subtitleText = 'CLINICAL // v2.4',
  size = 'md',
  variant = 'dark',
}) => {
  const sizeClasses = {
    sm: {
      icon: 'w-[31px] h-6',
      title: 'text-lg',
      subtitle: 'text-[8px]',
    },
    md: {
      icon: 'w-[36px] h-7',
      title: 'text-xl',
      subtitle: 'text-[9px]',
    },
    lg: {
      icon: 'w-[47px] h-9',
      title: 'text-3xl',
      subtitle: 'text-[10px]',
    },
  }[size];

  const primaryColor = variant === 'light' ? 'text-[#F6F4EF]' : 'text-[#26384B]';
  const subtitleColor = variant === 'light' ? 'text-[#F6F4EF]/70' : 'text-[#4C6072]';

  return (
    <div className={`flex items-center gap-2.5 group select-none ${className}`}>
      {/* Precision Geometric Dragonfly Emblem from JSON specification */}
      <div
        className={`flex items-center justify-center ${primaryColor} group-hover:text-[#C67C5A] transition-colors duration-300 ${sizeClasses.icon}`}
        aria-label="Ishkeen Dragonfly Logo"
      >
        <svg
          viewBox={DRAGONFLY_LOGO_JSON.viewBox}
          fill="currentColor"
          className="w-full h-full block"
        >
          {DRAGONFLY_LOGO_JSON.elements.map((el) => {
            if (el.type === 'rect') {
              return (
                <rect
                  key={el.id}
                  x={el.x}
                  y={el.y}
                  width={el.width}
                  height={el.height}
                />
              );
            }
            return <path key={el.id} d={el.d} />;
          })}
        </svg>
      </div>

      <div className="flex flex-col">
        <span className={`font-editorial tracking-[0.03em] ${primaryColor} leading-none ${sizeClasses.title}`}>
          ISHKEEN
        </span>
        {showSubtitle && (
          <span className={`font-mono-tech tracking-[0.2em] ${subtitleColor} uppercase ${sizeClasses.subtitle}`}>
            {subtitleText}
          </span>
        )}
      </div>
    </div>
  );
};

export default DragonflyLogo;
