'use client'

import { useEffect } from 'react'

const COOKIE_NAME = 'cultr_first_visit'

function hasCookie(name: string): boolean {
  return document.cookie.split(';').some((c) => c.trim().startsWith(name + '='))
}

export function VisitorTracker() {
  useEffect(() => {
    if (hasCookie(COOKIE_NAME)) return
    fetch('/api/visitor/new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        site: window.location.hostname,
        landingPage: window.location.pathname,
        referrer: document.referrer || null,
        userAgent: navigator.userAgent,
      }),
    }).catch(() => {})
  }, [])

  return null
}
