'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-body font-medium transition-colors duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-cream'

    const variants = {
      primary: 'bg-brand-primary text-brand-cream hover:bg-brand-primaryHover focus:ring-brand-primary rounded-full',
      secondary: 'bg-transparent text-brand-primary border border-brand-primary/30 hover:bg-brand-primary/5 hover:border-brand-primary/50 focus:ring-brand-primary/50 rounded-full',
      ghost: 'bg-transparent text-brand-primary hover:text-brand-primaryLight focus:ring-transparent rounded-full',
    }

    const sizes = {
      sm: 'py-2 px-5 text-xs',
      md: 'py-3 px-6 text-sm',
      lg: 'py-3.5 px-7 text-sm',
    }

    return (
      <motion.button
        ref={ref}
        whileHover={!disabled && variant !== 'ghost' ? { scale: 1.02 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...(props as any)}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </span>
        ) : (
          children
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export default Button
