import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/cn"
import type { ComponentStatus } from "./types"

export const status: ComponentStatus = 'Stable'

const glassVariants = cva(
  "relative overflow-hidden rounded-[32px] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
  {
    variants: {
      variant: {
        subtle: "bg-white/40 backdrop-blur-[40px] border border-white/60 shadow-[0_0_50px_rgba(59,130,246,0.15)] ring-1 ring-inset ring-white/50",
        deep: "bg-white/40 backdrop-blur-[40px] border border-white/60 shadow-[0_0_60px_rgba(59,130,246,0.25)] ring-1 ring-inset ring-white/50",
      },
    },
    defaultVariants: {
      variant: "subtle",
    },
  }
)

export interface GlassProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassVariants> {}

const Glass = React.forwardRef<HTMLDivElement, GlassProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(glassVariants({ variant }), className)}
      {...props}
    />
  )
)
Glass.displayName = "Glass"

export { Glass, glassVariants }
