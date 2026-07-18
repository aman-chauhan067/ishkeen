import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/cn"
import type { ComponentStatus } from "./types"

export const status: ComponentStatus = 'ProductionReady'

const sectionVariants = cva(
  "w-full py-16 md:py-24 lg:py-32",
  {
    variants: {
      spacing: {
        none: "py-0",
        sm: "py-8 md:py-12",
        default: "py-16 md:py-24 lg:py-32",
        lg: "py-24 md:py-32 lg:py-48",
      },
    },
    defaultVariants: {
      spacing: "default",
    },
  }
)

export interface SectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> {}

const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, spacing, ...props }, ref) => (
    <section ref={ref} className={cn(sectionVariants({ spacing }), className)} {...props} />
  )
)
Section.displayName = "Section"

export { Section, sectionVariants }
