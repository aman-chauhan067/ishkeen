import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/cn"
import type { ComponentStatus } from "./types"

export const status: ComponentStatus = 'ProductionReady'

const containerVariants = cva(
  "mx-auto w-full px-4 sm:px-6 lg:px-8",
  {
    variants: {
      size: {
        sm: "max-w-3xl",
        default: "max-w-7xl",
        fluid: "max-w-[100vw]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, ...props }, ref) => (
    <div ref={ref} className={cn(containerVariants({ size }), className)} {...props} />
  )
)
Container.displayName = "Container"

export { Container, containerVariants }
