import * as React from "react"
import { motion } from "framer-motion"

export interface StaggerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  delay?: number;
  className?: string;
  amount?: "some" | "all" | number;
}

export const Stagger: React.FC<StaggerProps> = ({ 
  children, 
  staggerDelay = 0.1, 
  delay = 0,
  className,
  amount = 0.2
}) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      }
    }
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export const StaggerItem: React.FC<{ children: React.ReactNode, className?: string, yOffset?: number }> = ({ children, className, yOffset = 20 }) => {
  const item = {
    hidden: { opacity: 0, y: yOffset },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] } as any
    }
  }

  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  )
}
