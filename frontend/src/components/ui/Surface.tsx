import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/cn"
import type { ComponentStatus } from "./types"

export const status: ComponentStatus = 'ProductionReady'

const surfaceVariants = cva(
  "rounded-2xl transition-all duration-500 ease-editorial",
  {
    variants: {
      elevation: {
        none: "shadow-none",
        1: "shadow-elevate-1",
        2: "shadow-elevate-2",
        3: "shadow-elevate-3",
      },
      background: {
        card: "bg-card border border-border",
        muted: "bg-muted border border-border",
        transparent: "bg-transparent",
      },
      interactive: {
        true: "hover:-translate-y-[2px] cursor-pointer",
        false: "",
      },
    },
    compoundVariants: [
      {
        elevation: 1,
        interactive: true,
        className: "hover:shadow-elevate-2",
      },
      {
        elevation: 2,
        interactive: true,
        className: "hover:shadow-elevate-3",
      },
    ],
    defaultVariants: {
      elevation: 1,
      background: "card",
      interactive: false,
    },
  }
)

export interface SurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceVariants> {}

const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  ({ className, elevation, background, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(surfaceVariants({ elevation, background, interactive }), className)}
      {...props}
    />
  )
)
Surface.displayName = "Surface"

export { Surface, surfaceVariants }
