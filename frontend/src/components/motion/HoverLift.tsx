import * as React from "react"
import { motion } from "framer-motion"

export interface HoverLiftProps {
  children: React.ReactNode;
  className?: string;
  y?: number;
}

export const HoverLift: React.FC<HoverLiftProps> = ({ children, className, y = -3 }) => {
  return (
    <motion.div
      whileHover={{ y }}
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
