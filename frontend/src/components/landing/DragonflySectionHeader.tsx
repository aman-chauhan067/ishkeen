import React from 'react';

interface DragonflySectionHeaderProps {
  index: string;
  title: string;
  tag?: string;
  className?: string;
}

export const DragonflySectionHeader: React.FC<DragonflySectionHeaderProps> = ({
  index,
  title,
  tag = 'SYS::OPERATIONAL',
  className = '',
}) => {
  return (
    <div className={`sticky top-[73px] z-30 w-full bg-[#F6F4EF]/90 backdrop-blur-md border-b border-[#26384B]/15 transition-all duration-300 ${className}`}>
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-3.5 flex items-center justify-between font-mono-tech text-xs text-[#26384B]">
        {/* Left: Section Index & Title */}
        <div className="flex items-center gap-4">
          <span className="text-[#C67C5A] font-bold">[ {index} ]</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#26384B]/40" />
          <span className="tracking-[0.2em] font-medium uppercase text-[#26384B]">{title}</span>
        </div>

        {/* Right: Technical Tag & Crosshair */}
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline-block text-[10px] tracking-widest text-[#4C6072] uppercase px-2.5 py-0.5 rounded-full bg-[#26384B]/5">
            {tag}
          </span>
          <span className="text-[#C67C5A] font-bold text-sm">+</span>
        </div>
      </div>
    </div>
  );
};

export default DragonflySectionHeader;
