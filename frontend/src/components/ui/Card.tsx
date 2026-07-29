import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AmbientGlow } from "../motion/AmbientGlow"
import { cn } from "../../lib/cn"
import type { ComponentStatus } from "./types"

export const status: ComponentStatus = 'ProductionReady'

const cardVariants = cva(
  "relative z-10 rounded-[32px] transition-all ease-[var(--luxury-ease)] duration-[600ms]",
  {
    variants: {
      variant: {
        default: "bg-white/40 backdrop-blur-[40px] border border-white/60 shadow-[0_0_50px_rgba(59,130,246,0.15)] ring-1 ring-inset ring-white/50",
        elevated: "bg-white/40 backdrop-blur-[40px] border border-white/60 shadow-[0_0_60px_rgba(59,130,246,0.25)] ring-1 ring-inset ring-white/50",
        glass: "bg-white/40 backdrop-blur-[40px] border border-white/60 shadow-[0_0_50px_rgba(59,130,246,0.15)] ring-1 ring-inset ring-white/50",
        editorial: "bg-transparent border-none shadow-none rounded-none",
        interactive: "group bg-white/40 backdrop-blur-[40px] border border-white/60 shadow-[0_0_50px_rgba(59,130,246,0.15)] ring-1 ring-inset ring-white/50 hover:border-blue-300 hover:shadow-[0_0_60px_rgba(59,130,246,0.25)] hover:-translate-y-1 cursor-pointer",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, children, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant }), className)} {...props}>
      {children}
      {variant === 'interactive' && <AmbientGlow blur="blur-[100px]" />}
    </div>
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-2 p-12 sm:p-16", className)}
      {...props}
    />
  )
)
CardHeader.displayName = "CardHeader"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-12 sm:p-16 pt-0 sm:pt-0", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-12 sm:p-16 pt-0 sm:pt-0", className)}
      {...props}
    />
  )
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardContent, CardFooter, cardVariants }
