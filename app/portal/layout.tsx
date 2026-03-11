'use client'

import { useEffect, useState, useRef, useCallback, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Spinner } from '@/components/ui/Spinner'

// ===========================================
// CONSTANTS
// ===========================================

/** Refresh access token after 12 minutes of activity (token expires at 15 min) */
const REFRESH_INTERVAL_MS = 12 * 60 * 1000

/** Activity events to track for session refresh */
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'] as const

// ===========================================
// PORTAL LAYOUT
// ===========================================

export default function PortalLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isLoginPage = pathname === '/portal/login'

  // Skip auth guard on login page
  if (isLoginPage) {
    return <>{children}</>
  }

  return <AuthGuard>{children}</AuthGuard>
}

// ===========================================
// AUTH GUARD (only for non-login portal pages)
// ===========================================

function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [isAuthed, setIsAuthed] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  // Refs for activity-based refresh
  const activityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const refreshLockRef = useRef<Promise<void> | null>(null)

  // ===========================================
  // REFRESH SESSION
  // ===========================================

  const refreshSession = useCallback(async (): Promise<boolean> => {
    // Prevent concurrent refresh calls
    if (refreshLockRef.current) {
      await refreshLockRef.current
      return true
    }

    const refreshPromise = (async () => {
      try {
        const res = await fetch('/api/portal/refresh', { method: 'POST' })
        if (res.ok) return true
        return false
      } catch {
        return false
      }
    })()

    refreshLockRef.current = refreshPromise.then(() => {})

    const success = await refreshPromise
    refreshLockRef.current = null
    return success
  }, [])

  // ===========================================
  // INITIAL AUTH CHECK
  // ===========================================

  useEffect(() => {
    let cancelled = false

    async function checkAuth() {
      const valid = await refreshSession()
      if (cancelled) return

      if (valid) {
        setIsAuthed(true)
      } else {
        router.replace('/portal/login')
      }
      setIsChecking(false)
    }

    checkAuth()

    return () => {
      cancelled = true
    }
  }, [refreshSession, router])

  // ===========================================
  // ACTIVITY-BASED TOKEN REFRESH (AUTH-04)
  // ===========================================

  useEffect(() => {
    if (!isAuthed) return

    function resetActivityTimer() {
      // Clear existing timer
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current)
      }

      // Set new timer: refresh token after 12 minutes of activity
      activityTimerRef.current = setTimeout(async () => {
        const success = await refreshSession()
        if (!success) {
          router.replace('/portal/login?expired=true')
        }
      }, REFRESH_INTERVAL_MS)
    }

    // Track user activity
    const handlers = ACTIVITY_EVENTS.map((event) => {
      const handler = () => resetActivityTimer()
      window.addEventListener(event, handler, { passive: true })
      return { event, handler }
    })

    // Start initial timer
    resetActivityTimer()

    return () => {
      // Cleanup listeners and timer
      handlers.forEach(({ event, handler }) => {
        window.removeEventListener(event, handler)
      })
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current)
      }
    }
  }, [isAuthed, refreshSession, router])

  // ===========================================
  // RENDER
  // ===========================================

  if (isChecking) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!isAuthed) {
    return null
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      {children}
    </div>
  )
}
