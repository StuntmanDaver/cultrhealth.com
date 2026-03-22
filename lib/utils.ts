import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import React from 'react'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns the cookie domain for cross-subdomain sharing.
 * On cultrhealth.com (staging/production/join), returns '.cultrhealth.com'
 * so cookies are shared across all subdomains.
 * On localhost/dev, returns undefined (browser default).
 */
export function getCookieDomain(): string | undefined {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  return siteUrl.includes('cultrhealth.com') ? '.cultrhealth.com' : undefined
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
