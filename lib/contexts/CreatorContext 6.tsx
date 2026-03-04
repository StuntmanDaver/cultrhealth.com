'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type {
  Creator,
  CreatorDashboardMetrics,
  TrackingLink,
  AffiliateCode,
} from '@/lib/config/affiliate'

interface CreatorContextType {
  creator: Creator | null
  metrics: CreatorDashboardMetrics | null
  links: TrackingLink[]
  codes: AffiliateCode[]
  loading: boolean
  error: string | null
  refreshAll: () => Promise<void>
  refreshMetrics: () => Promise<void>
  refreshLinks: () => Promise<void>
  refreshCodes: () => Promise<void>
}

const CreatorContext = createContext<CreatorContextType | undefined>(undefined)

export function CreatorProvider({ children }: { children: ReactNode }) {
  const [creator, setCreator] = useState<Creator | null>(null)
  const [metrics, setMetrics] = useState<CreatorDashboardMetrics | null>(null)
  const [links, setLinks] = useState<TrackingLink[]>([])
  const [codes, setCodes] = useState<AffiliateCode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/creators/dashboard')
      if (res.ok) {
        const data = await res.json()
        setMetrics(data.metrics)
        if (data.creator) {
          setCreator((prev) => (prev ? { ...prev, ...data.creator } : prev))
        }
      }
    } catch (err) {
      console.error('Failed to refresh metrics:', err)
    }
  }, [])

  const refreshLinks = useCallback(async () => {
    try {
      const res = await fetch('/api/creators/links')
      if (res.ok) {
        const data = await res.json()
        setLinks(data.links || [])
      }
    } catch (err) {
      console.error('Failed to refresh links:', err)
    }
  }, [])

  const refreshCodes = useCallback(async () => {
    try {
      const res = await fetch('/api/creators/codes')
      if (res.ok) {
        const data = await res.json()
        setCodes(data.codes || [])
      }
    } catch (err) {
      console.error('Failed to refresh codes:', err)
    }
  }, [])

  const refreshAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch profile first
      const profileRes = await fetch('/api/creators/profile')
      if (!profileRes.ok) {
        setError('Failed to load creator profile')
        return
      }
      const profileData = await profileRes.json()
      setCreator(profileData.creator)

      // Fetch the rest in parallel
      await Promise.all([refreshMetrics(), refreshLinks(), refreshCodes()])
    } catch (err) {
      setError('Failed to load creator data')
      console.error('Creator context error:', err)
    } finally {
      setLoading(false)
    }
  }, [refreshMetrics, refreshLinks, refreshCodes])

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  return (
    <CreatorContext.Provider
      value={{
        creator,
        metrics,
        links,
        codes,
        loading,
        error,
        refreshAll,
        refreshMetrics,
        refreshLinks,
        refreshCodes,
      }}
    >
      {children}
    </CreatorContext.Provider>
  )
}

export function useCreator() {
  const context = useContext(CreatorContext)
  if (!context) {
    throw new Error('useCreator must be used within CreatorProvider')
  }
  return context
}
