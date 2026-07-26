import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AmbientGlow } from "../motion/AmbientGlow"
import { cn } from "../../lib/cn"
import type { ComponentStatus } from "./types"

export const status: ComponentStatus = 'ProductionReady'

const buttonVariants = cva(
  "group relative z-10 inline-flex items-center justify-center whitespace-nowrap rounded-full font-sans text-sm font-bold tracking-wide uppercase transition-all ease-[cubic-bezier(0.22,1,0.36,1)] duration-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 min-h-[64px]",
  {
    variants: {
      variant: {
        primary:
          "bg-[#26384B] text-[#F6F4EF] border border-transparent",
        secondary:
          "bg-[#F6F4EF] text-[#26384B] border border-[#26384B]",
        accent:
          "bg-[#C67C5A] text-[#26384B]",
        outline:
          "border border-foreground/20 bg-transparent text-foreground",
        ghost: "hover:bg-foreground/5 text-foreground",
        danger:
          "bg-[#C67C5A] text-[#26384B]",
        text: "text-foreground hover:opacity-70 underline-offset-4 hover:underline",
      },
      size: {
        default: "px-10 py-4",
        sm: "px-6 text-xs min-h-[48px]",
        lg: "px-12 text-base min-h-[72px]",
        icon: "w-16 min-h-[64px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
        {variant !== 'text' && variant !== 'ghost' && (
          <AmbientGlow />
        )}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
