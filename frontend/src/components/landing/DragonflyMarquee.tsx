import React, { useEffect, useRef } from 'react';

interface DragonflyMarqueeProps {
  text?: string;
  speed?: number;
  className?: string;
}

export const DragonflyMarquee: React.FC<DragonflyMarqueeProps> = ({
  text = ' +   01 // 43-POINT_FACIAL_MESH_AI   +   SYS::HYBRID_CV_v2.4   +   02 // OPENCV_MULTI_SPECTRAL_ANALYSIS   +   FITZPATRICK_I–VI_CALIBRATION   +   03 // DERMATOLOGICAL_AM/PM_REGIMEN   +   LATENCY // <3.5S   + ',
  speed = 1.2,
  className = '',
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef(0);
  const scrollVelocityRef = useRef(0);
  const lastScrollYRef = useRef(window.scrollY);

  useEffect(() => {
    let animFrame: number;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollYRef.current;
      scrollVelocityRef.current += delta * 0.4;
      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    const animate = () => {
      // Decay extra scroll velocity
      scrollVelocityRef.current *= 0.92;

      // Base speed + scroll velocity influence
      const totalSpeed = speed + scrollVelocityRef.current;
      positionRef.current -= totalSpeed;

      // Reset when looped halfway
      if (positionRef.current <= -2000) {
        positionRef.current = 0;
      }
      if (positionRef.current > 0) {
        positionRef.current = -2000;
      }

      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${positionRef.current}px, 0, 0)`;
      }

      animFrame = requestAnimationFrame(animate);
    };

    animFrame = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animFrame);
    };
  }, [speed]);

  // Duplicate items for seamless endless marquee
  const items = [1, 2, 3, 4, 5, 6];

  return (
    <div className={`w-full overflow-hidden whitespace-nowrap border-y border-[#26384B]/15 bg-[#F6F4EF] py-4 select-none ${className}`}>
      <div ref={trackRef} className="inline-flex items-center font-mono-tech text-xs md:text-sm text-[#26384B]/80 tracking-[0.25em] uppercase">
        {items.map((key) => (
          <span key={key} className="inline-flex items-center">
            <span className="mx-6 text-[#C67C5A] font-bold">+</span>
            <span>{text}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default DragonflyMarquee;
