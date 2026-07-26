import * as React from 'react';
import { motion } from 'framer-motion';

export interface SectionBlurZoomProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  className?: string;
  id?: string;
}

/**
 * Optimized, 60-FPS hardware-accelerated section container reveal:
 * Removes heavy GPU blur filters on large containers to prevent browser lag/stutter.
 * Triggers immediately (10% from bottom up) with crisp, buttery-smooth editorial easing.
 */
export const SectionBlurZoom: React.FC<SectionBlurZoomProps> = ({
  children,
  duration = 0.55,
  delay = 0,
  className = '',
  id,
}) => {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05, margin: '0px 0px -10% 0px' }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`w-full overflow-hidden ${className}`}
    >
      {children}
    </motion.section>
  );
};

export default SectionBlurZoom;
