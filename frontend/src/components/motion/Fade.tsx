import * as React from "react"
import { motion } from "framer-motion"

export interface FadeProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  className?: string;
}

export const Fade: React.FC<FadeProps> = ({ children, duration = 0.8, delay = 0, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration, delay, ease: [0.25, 1, 0.5, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
