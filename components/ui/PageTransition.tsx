'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
      transition={{
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1], // Custom Apple-like ease
      }}
    >
      {children}
    </motion.div>
  )
}
