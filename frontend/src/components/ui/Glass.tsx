import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/cn"
import type { ComponentStatus } from "./types"

export const status: ComponentStatus = 'Stable'

const glassVariants = cva(
  "relative overflow-hidden rounded-3xl border border-[#253A4A]/5 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
  {
    variants: {
      variant: {
        subtle: "bg-[#F8F5F1]/95 shadow-[0_8px_30px_rgba(37,58,74,0.04)]",
        deep: "bg-[#FCFBF8]/95 shadow-[0_20px_60px_rgba(37,58,74,0.06)]",
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
