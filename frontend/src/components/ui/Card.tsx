import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AmbientGlow } from "../motion/AmbientGlow"
import { cn } from "../../lib/cn"
import type { ComponentStatus } from "./types"

export const status: ComponentStatus = 'ProductionReady'

const cardVariants = cva(
  "relative z-10 rounded-[40px] border transition-all ease-[var(--luxury-ease)] duration-[600ms]",
  {
    variants: {
      variant: {
        default: "bg-[#F6F4EF] border-[#26384B]/[0.02] shadow-[0_40px_120px_rgba(37,58,74,0.03)]",
        elevated: "bg-[#F6F4EF] border-transparent shadow-[0_60px_140px_rgba(37,58,74,0.04)]",
        glass: "bg-[#FBFAF7]/90 border-[#26384B]/[0.02] shadow-[0_30px_100px_rgba(37,58,74,0.02)] backdrop-blur-md",
        editorial: "bg-transparent border-none shadow-none rounded-none",
        interactive: "group bg-[#F6F4EF] border-[#26384B]/[0.02] shadow-[0_40px_120px_rgba(37,58,74,0.03)] hover:border-[#26384B]/5 hover:-translate-y-1 cursor-pointer",
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
