import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/cn"
import type { ComponentStatus } from "./types"

export const status: ComponentStatus = 'ProductionReady'

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm transition-all duration-300 ease-editorial",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        success: "bg-success/10 text-success border-success/20",
        error: "bg-danger/10 text-danger border-danger/20",
        warning: "bg-warning/10 text-warning-foreground border-warning/20",
        info: "bg-muted text-muted-foreground border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  message?: string
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, message, children, ...props }, ref) => (
    <div
      ref={ref}
      role={variant === "error" ? "alert" : "status"}
      aria-live="polite"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {message && <p className="font-medium">{message}</p>}
      {children}
    </div>
  )
)
Alert.displayName = "Alert"

export { Alert, alertVariants }
