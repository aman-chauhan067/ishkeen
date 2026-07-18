import * as React from "react"
import { motion } from "framer-motion"

export interface LightBloomProps {
  color: string;
  opacity?: number;
  size?: string;
  position: { top?: string, left?: string, right?: string, bottom?: string };
  delay?: number;
}

export const LightBloom: React.FC<LightBloomProps> = ({ 
  color, 
  opacity = 0.5, 
  size = "500px", 
  position,
  delay = 0 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity, scale: [0.8, 1.1, 0.9, 1.2, 1] }}
      transition={{ 
        opacity: { duration: 2, delay },
        scale: { duration: 20, delay, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
      }}
      className="absolute rounded-full mix-blend-multiply blur-[100px] dark:mix-blend-screen pointer-events-none"
      style={{
        backgroundColor: color,
        width: size,
        height: size,
        ...position
      }}
    />
  )
}
