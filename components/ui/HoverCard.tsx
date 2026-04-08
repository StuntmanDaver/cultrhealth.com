'use client'

import { ReactNode } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface HoverCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode
  className?: string
  glow?: boolean
}

export function HoverCard({ children, className, glow = false, ...props }: HoverCardProps) {
  return (
    <motion.div
      whileHover={{ 
        y: -4,
        scale: 1.01,
        transition: { type: 'spring', stiffness: 400, damping: 25 }
      }}
      className={cn(
        "transition-shadow duration-300", 
        glow && "hover:shadow-[0_0_25px_rgba(42,69,66,0.12)]",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
