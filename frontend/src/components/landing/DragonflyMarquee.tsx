import React from 'react';

interface DragonflyMarqueeProps {
  text?: string;
  speed?: number;
  className?: string;
}

/**
 * Optimized Marquee — uses pure CSS animation instead of requestAnimationFrame.
 *
 * Previous implementation:
 *   - Own rAF loop running at 60fps (2 instances = 2 extra rAF loops)
 *   - Scroll listener updating velocity ref
 *   - Manual style.transform mutation each frame
 *
 * New implementation:
 *   - CSS animation with `translate3d` (GPU-composited, zero main thread cost)
 *   - will-change: transform (promotes to own compositing layer)
 *   - No JavaScript animation loop at all
 *   - No scroll listener (the scroll-velocity acceleration was imperceptible anyway)
 */
export const DragonflyMarquee: React.FC<DragonflyMarqueeProps> = ({
  text = ' +   01 // 43-POINT_FACIAL_MESH_AI   +   SYS::HYBRID_CV_v2.4   +   02 // OPENCV_MULTI_SPECTRAL_ANALYSIS   +   FITZPATRICK_I–VI_CALIBRATION   +   03 // DERMATOLOGICAL_AM/PM_REGIMEN   +   LATENCY // <3.5S   + ',
  speed = 1.2,
  className = '',
}) => {
  // Slower speed = longer duration. Base: speed 1.0 = 40s loop
  const duration = Math.max(10, Math.round(40 / speed));

  return (
    <div
      className={`w-full overflow-hidden whitespace-nowrap border-y border-[#26384B]/15 bg-[#F6F4EF] py-4 select-none ${className}`}
    >
      <div
        className="inline-flex items-center font-mono-tech text-xs md:text-sm text-[#26384B]/80 tracking-[0.25em] uppercase"
        style={{
          animation: `marquee-scroll ${duration}s linear infinite`,
          willChange: 'transform',
        }}
      >
        {/* 4 copies for seamless loop (2 visible + 2 buffer for smooth wrap) */}
        {[1, 2, 3, 4].map((key) => (
          <span key={key} className="inline-flex items-center shrink-0">
            <span className="mx-6 text-[#C67C5A] font-bold">+</span>
            <span>{text}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default DragonflyMarquee;
