'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { ConsultationCardData } from '@/components/consultations/ConsultationCard'

export interface ProviderDashboardMetrics {
  todayConsultations: number
  pendingIntakes: number
  patientsThisMonth: number
  activePatients: number
}

export interface PendingIntake {
  id: number
  customer_email: string
  plan_tier: string
  intake_status: string
  created_at: string
  completed_at: string | null
  asher_order_id: number | null
  asher_status: string | null
  medication_packages: unknown
}

interface ProviderContextType {
  providerEmail: string
  metrics: ProviderDashboardMetrics | null
  todayConsultations: ConsultationCardData[]
  pendingIntakes: PendingIntake[]
  loading: boolean
  error: string | null
  refreshAll: () => Promise<void>
  refreshMetrics: () => Promise<void>
  refreshConsultations: () => Promise<void>
  refreshIntakes: () => Promise<void>
}

const ProviderContext = createContext<ProviderContextType | undefined>(undefined)

export function ProviderProvider({ email, children }: { email: string; children: ReactNode }) {
  const [metrics, setMetrics] = useState<ProviderDashboardMetrics | null>(null)
  const [todayConsultations, setTodayConsultations] = useState<ConsultationCardData[]>([])
  const [pendingIntakes, setPendingIntakes] = useState<PendingIntake[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/provider/dashboard')
      if (res.ok) {
        const data = await res.json()
        setMetrics(data.metrics)
      }
    } catch (err) {
      console.error('Failed to refresh provider metrics:', err)
    }
  }, [])

  const refreshConsultations = useCallback(async () => {
    try {
      const res = await fetch('/api/provider/consultations?upcoming=true')
      if (res.ok) {
        const data = await res.json()
        setTodayConsultations(data.consultations || [])
      }
    } catch (err) {
      console.error('Failed to refresh consultations:', err)
    }
  }, [])

  const refreshIntakes = useCallback(async () => {
    try {
      const res = await fetch('/api/provider/intakes?status=pending&limit=5')
      if (res.ok) {
        const data = await res.json()
        setPendingIntakes(data.intakes || [])
      }
    } catch (err) {
      console.error('Failed to refresh intakes:', err)
    }
  }, [])

  const refreshAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([refreshMetrics(), refreshConsultations(), refreshIntakes()])
    } catch (err) {
      setError('Failed to load provider data')
      console.error('Provider context error:', err)
    } finally {
      setLoading(false)
    }
  }, [refreshMetrics, refreshConsultations, refreshIntakes])

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  return (
    <ProviderContext.Provider
      value={{
        providerEmail: email,
        metrics,
        todayConsultations,
        pendingIntakes,
        loading,
        error,
        refreshAll,
        refreshMetrics,
        refreshConsultations,
        refreshIntakes,
      }}
    >
      {children}
    </ProviderContext.Provider>
  )
}

export function useProvider() {
  const context = useContext(ProviderContext)
  if (!context) {
    throw new Error('useProvider must be used within ProviderProvider')
  }
  return context
}
