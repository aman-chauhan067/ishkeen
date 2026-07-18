import * as React from "react"
import { motion } from "framer-motion"

export interface BlurRevealProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  className?: string;
}

export const BlurReveal: React.FC<BlurRevealProps> = ({ 
  children, 
  duration = 1.2, 
  delay = 0,
  className 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(10px)", y: 15 }}
      whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration, delay, ease: [0.25, 1, 0.5, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
