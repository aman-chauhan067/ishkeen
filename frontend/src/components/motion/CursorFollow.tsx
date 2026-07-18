import * as React from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"

export const CursorFollow: React.FC = () => {
  const [isVisible, setIsVisible] = React.useState(false)
  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)

  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 }
  const x = useSpring(cursorX, springConfig)
  const y = useSpring(cursorY, springConfig)

  React.useEffect(() => {
    // Disable on touch devices
    if (window.matchMedia("(hover: none)").matches) return
    // Respect reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 16)
      cursorY.set(e.clientY - 16)
    }
    
    const handleMouseEnter = () => setIsVisible(true)
    const handleMouseLeave = () => setIsVisible(false)

    window.addEventListener("mousemove", moveCursor)
    document.body.addEventListener("mouseenter", handleMouseEnter)
    document.body.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      window.removeEventListener("mousemove", moveCursor)
      document.body.removeEventListener("mouseenter", handleMouseEnter)
      document.body.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [cursorX, cursorY])

  if (!isVisible) return null

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 z-50 h-8 w-8 rounded-full border border-foreground/20 bg-accent/30 backdrop-blur-sm mix-blend-difference hidden md:block"
      style={{ x, y }}
    />
  )
}
