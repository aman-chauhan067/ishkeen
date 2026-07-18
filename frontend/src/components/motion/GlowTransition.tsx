import * as React from "react"
import { motion } from "framer-motion"

export interface GlowTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const GlowTransition: React.FC<GlowTransitionProps> = ({ children, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0.5, filter: "brightness(1) blur(0px)" }}
      whileHover={{ opacity: 1, filter: "brightness(1.1) blur(2px)" }}
      transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
