'use client'

import { useState, useEffect, useCallback } from 'react'
import { KitTimeline } from '@/components/portal/KitTimeline'
import { KitDetailCard } from '@/components/portal/KitDetailCard'
import { KitRegistrationForm } from '@/components/portal/KitRegistrationForm'
import { KitEmptyState } from '@/components/portal/KitEmptyState'
import type { KitLifecycleState } from '@/lib/siphox/kit-lifecycle'

interface KitOrderWithLifecycle {
  id: number
  lifecycleState: KitLifecycleState
  tracking_number?: string | null
  [key: string]: unknown
}

interface LabsData {
  kitOrders: KitOrderWithLifecycle[]
  siphoxCustomerId: string | null
  tier: string | null
}

export default function LabsClient() {
  const [data, setData] = useState<LabsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadKitData = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch('/api/portal/labs')
      if (res.status === 401) return
      if (!res.ok) throw new Error('Failed to load kit data')
      const json = await res.json()
      setData({
        kitOrders: json.kitOrders || [],
        siphoxCustomerId: json.siphoxCustomerId || null,
        tier: json.tier || null,
      })
    } catch {
      setError('Unable to load your lab data right now.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadKitData()
  }, [loadKitData])

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <div className="h-8 bg-brand-primary/10 rounded w-1/3 mb-6 animate-pulse" />
        <div className="rounded-2xl border border-brand-primary/10 p-6 animate-pulse">
          <div className="h-6 bg-brand-primary/10 rounded w-1/2 mb-4" />
          <div className="h-4 bg-brand-primary/10 rounded w-2/3 mb-3" />
          <div className="h-4 bg-brand-primary/10 rounded w-1/3" />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-display font-bold text-brand-primary mb-6">
          Blood Test Kit
        </h1>
        <div className="rounded-xl bg-red-50 border border-red-100 p-4">
          <p className="text-red-800 text-sm mb-2">{error}</p>
          <button
            onClick={() => {
              setIsLoading(true)
              loadKitData()
            }}
            className="text-sm text-red-700 underline hover:text-red-900"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  const hasKitOrders = data && data.kitOrders.length > 0
  const showEmptyState =
    !hasKitOrders && (!data?.siphoxCustomerId || !hasKitOrders)

  // Empty state
  if (showEmptyState) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-display font-bold text-brand-primary mb-6">
          Blood Test Kit
        </h1>
        <KitEmptyState
          tier={data?.tier || null}
          hasKitOrder={false}
        />
      </div>
    )
  }

  // Has kit orders -- show latest
  const latestOrder = data!.kitOrders[0]
  const lifecycleState = latestOrder.lifecycleState
  const showRegistrationForm = lifecycleState === 'shipped'

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-brand-primary mb-6">
        Blood Test Kit
      </h1>

      <KitTimeline
        currentState={lifecycleState}
        trackingNumber={latestOrder.tracking_number}
      />

      <KitDetailCard
        currentState={lifecycleState}
        trackingNumber={latestOrder.tracking_number}
      />

      {showRegistrationForm && (
        <KitRegistrationForm onSuccess={loadKitData} />
      )}
    </div>
  )
}
