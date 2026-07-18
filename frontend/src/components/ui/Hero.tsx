import * as React from "react"
import { cn } from "../../lib/cn"
import type { ComponentStatus } from "./types"

export const status: ComponentStatus = 'Stable'

export interface HeroProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Hero = React.forwardRef<HTMLDivElement, HeroProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden py-24 text-center",
        className
      )}
      {...props}
    >
      {/* 
        This is an ideal place to drop in the ambient Gradient A: The Hero Glow 
        using the background system later. For now, it provides structural centering.
      */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  )
)
Hero.displayName = "Hero"

export { Hero }
