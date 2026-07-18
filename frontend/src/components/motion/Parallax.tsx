import * as React from "react"
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion"

export interface ParallaxProps {
  children: React.ReactNode;
  offset?: number;
  className?: string;
}

function useParallax(value: MotionValue<number>, distance: number) {
  return useTransform(value, [0, 1], [-distance, distance])
}

export const Parallax: React.FC<ParallaxProps> = ({ children, offset = 50, className }) => {
  const ref = React.useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const y = useParallax(scrollYProgress, offset)

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  )
}
