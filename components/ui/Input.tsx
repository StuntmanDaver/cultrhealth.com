'use client'

import { InputHTMLAttributes, forwardRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, onFocus, onBlur, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const [isFocused, setIsFocused] = useState(false)

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      onBlur?.(e)
    }

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium mb-1.5 transition-colors duration-200',
              isFocused ? 'text-brand-primary' : 'text-brand-primary/70'
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full bg-white border border-brand-primary/20 rounded-lg',
              'px-4 py-3 text-brand-primary placeholder:text-brand-primary/40',
              'focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10',
              'transition-all duration-200 ease-out font-body text-sm',
              'hover:border-brand-primary/40',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
              className
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
          {/* Focus indicator line */}
          <div 
            className={cn(
              'absolute bottom-0 left-1/2 h-0.5 bg-brand-primary rounded-full transition-all duration-300 ease-out -translate-x-1/2',
              isFocused ? 'w-full opacity-100' : 'w-0 opacity-0'
            )}
          />
        </div>
        {error && (
          <p className="text-red-600 text-xs mt-1.5 animate-fade-in">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
