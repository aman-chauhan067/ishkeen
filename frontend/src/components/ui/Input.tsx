import * as React from "react"
import { AmbientGlow } from "../motion/AmbientGlow"
import { cn } from "../../lib/cn"
import type { ComponentStatus } from "./types"

export const status: ComponentStatus = 'ProductionReady'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  description?: string;
  error?: string;
  success?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  isTextarea?: boolean;
}

const Input = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  (
    { 
      className, 
      type, 
      label, 
      hint, 
      description, 
      error, 
      success, 
      leftIcon, 
      rightIcon, 
      isLoading, 
      isTextarea, 
      disabled, 
      id, 
      ...props 
    }, 
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === 'password';
    const currentType = isPassword && showPassword ? 'text' : type;

    const Component = isTextarea ? 'textarea' : 'input';

    const baseStyles = cn(
      "relative z-10 flex w-full rounded-[24px] border border-[#253A4A]/[0.02] bg-[#FCFBF8] shadow-[0_20px_40px_rgba(37,58,74,0.02)] px-6 py-4 text-base text-[#253A4A] transition-all duration-[600ms] ease-[var(--luxury-ease)] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#A8B5A2] focus-visible:outline-none focus-visible:-translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-50",
      isTextarea ? "min-h-[100px]" : "h-12",
      leftIcon && "pl-10",
      (rightIcon || isPassword || isLoading) && "pr-10",
      error && "border-danger focus-visible:ring-danger text-danger",
      success && "border-success focus-visible:ring-success text-success",
      className
    );

    return (
      <div className="w-full space-y-2">
        {(label || hint) && (
          <div className="flex items-center justify-between mb-2">
            {label && <label htmlFor={inputId} className="text-sm font-bold tracking-wide text-[#253A4A] uppercase peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>}
            {hint && <span className="text-xs text-[#A8B5A2]">{hint}</span>}
          </div>
        )}
        
        <div className="relative group">
          <AmbientGlow trigger="group-focus-within" blur="blur-[80px]" />
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          
          <Component
            id={inputId}
            type={isTextarea ? undefined : currentType}
            className={baseStyles}
            ref={ref as any}
            disabled={disabled || isLoading}
            aria-invalid={!!error}
            {...props}
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-muted-foreground">
            {isLoading && (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {!isLoading && rightIcon && rightIcon}
            {!isLoading && isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs hover:text-foreground focus:outline-none"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            )}
          </div>
        </div>

        {description && !error && !success && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {error && (
          <p className="text-sm font-medium text-danger">{error}</p>
        )}
        {success && (
          <p className="text-sm font-medium text-success">{success}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
