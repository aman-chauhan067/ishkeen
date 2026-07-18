import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/cn"
import type { ComponentStatus } from "./types"

export const status: ComponentStatus = 'ProductionReady'

const typographyVariants = cva(
  "text-foreground",
  {
    variants: {
      variant: {
        display: "heading-display text-foreground",
        hero: "heading-display text-foreground text-[clamp(2.5rem,6vw,6rem)]",
        h1: "heading-display text-[clamp(2rem,5vw,5rem)] text-foreground",
        h2: "heading-display text-[clamp(1.75rem,4vw,4rem)] text-foreground",
        h3: "heading-display text-[clamp(1.5rem,3vw,3rem)] text-foreground",
        h4: "heading-display text-[clamp(1.25rem,2vw,2.25rem)] text-foreground",
        body: "font-sans text-base leading-relaxed text-[#253A4A]",
        caption: "font-sans text-sm font-medium tracking-wide uppercase text-[#C8C4D8]",
        overline: "font-sans text-xs uppercase tracking-widest text-muted-foreground font-semibold",
        quote: "font-serif text-xl md:text-2xl italic text-muted-foreground border-l-2 border-border pl-4",
      },
    },
    defaultVariants: {
      variant: "body",
    },
  }
)

export interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  as?: React.ElementType
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant, as, ...props }, ref) => {
    
    // Determine default element if 'as' is not provided
    const defaultElements: Record<string, React.ElementType> = {
      display: "h1",
      hero: "h1",
      h1: "h1",
      h2: "h2",
      h3: "h3",
      h4: "h4",
      body: "p",
      caption: "span",
      overline: "span",
      quote: "blockquote",
    }
    
    const Component: any = as || (variant ? defaultElements[variant as string] : "p") || "p"

    return (
      <Component
        ref={ref}
        className={cn(typographyVariants({ variant }), className)}
        {...props}
      />
    )
  }
)
Typography.displayName = "Typography"

export { Typography, typographyVariants }
