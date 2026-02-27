import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import React from 'react'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Wraps every occurrence of "CULTR" in a string with a font-display span
 * so the brand name always renders in Playfair Display.
 * Returns React nodes (mixed text + spans).
 */
export function brandify(text: string): React.ReactNode {
  const parts = text.split(/(CULTR)/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    part === 'CULTR'
      ? React.createElement('span', { key: i, className: 'font-display font-bold' }, 'CULTR')
      : part
  )
}
