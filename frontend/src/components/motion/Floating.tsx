import * as React from "react"
import { motion } from "framer-motion"

export interface FloatingProps {
  children: React.ReactNode;
  duration?: number;
  yOffset?: number;
  className?: string;
}

export const Floating: React.FC<FloatingProps> = ({ 
  children, 
  duration = 4, 
  yOffset = 15,
  className 
}) => {
  return (
    <motion.div
      animate={{ y: [0, -yOffset, 0] }}
      transition={{ 
        duration, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
