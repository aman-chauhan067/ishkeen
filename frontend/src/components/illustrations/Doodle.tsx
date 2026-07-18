import React from 'react';
import { motion } from 'framer-motion';

export type DoodleType = 'sparkles' | 'stars' | 'wave' | 'arrow' | 'circle' | 'leaf' | 'face' | 'blob' | 'swirl';

interface DoodleProps {
  type: DoodleType;
  className?: string;
  delay?: number;
  color?: string;
}

export const Doodle: React.FC<DoodleProps> = ({ type, className = '', delay = 0, color = 'currentColor' }) => {
  const transition: any = { duration: 3, ease: 'easeInOut', delay };
  
  // Sketchy, thin paths representing pencil strokes
  const getPath = () => {
    switch (type) {
      case 'sparkles':
        return (
          <>
            <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={transition} d="M50 10C50 30 70 50 90 50C70 50 50 70 50 90C50 70 30 50 10 50C30 50 50 30 50 10Z" fill="none" stroke={color} strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" />
            <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={transition} d="M48 12C48 32 68 52 88 52C68 52 48 72 48 92" fill="none" stroke={color} strokeWidth="0.2" strokeLinecap="round" strokeDasharray="1 2" />
          </>
        );
      case 'stars':
        return (
          <>
            <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={transition} d="M50 10L61 40H93L67 59L77 90L50 70L23 90L33 59L7 40H39L50 10Z" fill="none" stroke={color} strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" />
            <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={transition} d="M50 8L62 42H95L65 61L79 92L50 72L21 92L35 61L5 42H38L50 8Z" fill="none" stroke={color} strokeWidth="0.2" strokeLinecap="round" strokeLinejoin="round" />
          </>
        );
      case 'wave':
        return (
          <>
            <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={transition} d="M10 50Q25 30 50 50T90 50" fill="none" stroke={color} strokeWidth="0.5" strokeLinecap="round" />
            <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={transition} d="M12 52Q27 32 52 52T92 52" fill="none" stroke={color} strokeWidth="0.2" strokeLinecap="round" strokeDasharray="2 3" />
          </>
        );
      case 'arrow':
        return (
          <>
            <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={transition} d="M10 50C30 50 60 50 90 50M70 30L90 50L70 70" fill="none" stroke={color} strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" />
            <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={transition} d="M10 51C30 51 60 51 90 51" fill="none" stroke={color} strokeWidth="0.2" strokeLinecap="round" />
          </>
        );
      case 'circle':
        return (
          <>
            <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={transition} d="M50 10A40 40 0 1 1 49.9 10" fill="none" stroke={color} strokeWidth="0.5" strokeLinecap="round" />
            <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={transition} d="M50 12A38 38 0 1 1 49.9 12" fill="none" stroke={color} strokeWidth="0.2" strokeLinecap="round" strokeDasharray="3 4" />
          </>
        );
      case 'leaf':
        return (
          <>
            <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={transition} d="M50 10C30 10 10 30 10 50C10 70 30 90 50 90C70 90 90 70 90 50C90 30 70 10 50 10ZM50 10C40 30 40 70 50 90" fill="none" stroke={color} strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" />
            <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={transition} d="M48 12C28 12 12 28 12 48" fill="none" stroke={color} strokeWidth="0.2" strokeLinecap="round" />
          </>
        );
      case 'face':
        return (
          <>
            <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={transition} d="M50 10A40 40 0 1 1 49.9 10" fill="none" stroke={color} strokeWidth="0.5" strokeLinecap="round" />
            <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={transition} d="M35 40C35 40 35 40 35 40.1M65 40C65 40 65 40 65 40.1M35 65Q50 75 65 65" fill="none" stroke={color} strokeWidth="0.5" strokeLinecap="round" />
          </>
        );
      case 'blob':
        return (
          <>
            <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={transition} d="M50 15C70 10 85 25 85 45C85 70 70 85 45 85C20 85 10 65 15 45C20 20 30 20 50 15Z" fill="none" stroke={color} strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" />
            <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={transition} d="M48 17C68 12 83 27 83 47" fill="none" stroke={color} strokeWidth="0.2" strokeLinecap="round" strokeDasharray="1 3" />
          </>
        );
      case 'swirl':
        return (
          <>
            <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={transition} d="M50 50C40 50 30 40 30 30C30 15 50 10 70 20C95 30 95 65 75 85C50 105 10 95 5 60" fill="none" stroke={color} strokeWidth="0.5" strokeLinecap="round" />
            <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={transition} d="M52 52C42 52 32 42 32 32C32 17 52 12 72 22" fill="none" stroke={color} strokeWidth="0.2" strokeLinecap="round" strokeDasharray="2 4" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      {getPath()}
    </svg>
  );
};

