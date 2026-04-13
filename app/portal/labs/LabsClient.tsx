'use client'

import { useState, useEffect, useCallback } from 'react'
import { KitTimeline } from '@/components/portal/KitTimeline'
import { KitDetailCard } from '@/components/portal/KitDetailCard'
import { KitRegistrationForm } from '@/components/portal/KitRegistrationForm'
import { KitEmptyState } from '@/components/portal/KitEmptyState'
import { LabsResultsView } from '@/components/portal/LabsResultsView'
import { TestTube2 } from 'lucide-react'
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
  needsPhone?: boolean
}

interface LabsClientProps {
  /** API endpoint for kit orders. Defaults to '/api/portal/labs'. */
  labsEndpoint?: string
  /** API endpoint for biomarker results. Defaults to '/api/portal/results'. */
  resultsEndpoint?: string
}

export default function LabsClient({
  labsEndpoint = '/api/portal/labs',
  resultsEndpoint = '/api/portal/results',
}: LabsClientProps = {}) {
  const [data, setData] = useState<LabsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadKitData = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch(labsEndpoint)
      if (res.status === 401) { setIsLoading(false); return }
      if (!res.ok) throw new Error('Failed to load kit data')
      const json = await res.json()
      setData({
        kitOrders: json.kitOrders || [],
        siphoxCustomerId: json.siphoxCustomerId || null,
        tier: json.tier || null,
        needsPhone: json.needsPhone || false,
      })
    } catch {
      setError('Unable to load your lab data right now.')
    } finally {
      setIsLoading(false)
    }
  }, [labsEndpoint])

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

  // Needs phone state (creator without phone)
  if (data?.needsPhone) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-display font-bold text-brand-primary mb-6">
          Blood Test Kit
        </h1>
        <div className="rounded-2xl border border-brand-primary/10 bg-white p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-sage/30 flex items-center justify-center mx-auto mb-4">
            <TestTube2 className="w-7 h-7 text-brand-primary" />
          </div>
          <h2 className="text-lg font-semibold text-brand-primary mb-2">
            Phone Number Required
          </h2>
          <p className="text-sm text-brand-primary/60 mb-6 max-w-sm mx-auto">
            Add your phone number in Settings to access blood testing and view your biomarker results.
          </p>
          <a
            href="/creators/portal/settings"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white rounded-full text-sm font-medium hover:bg-forest-light transition-colors"
          >
            Go to Settings
          </a>
        </div>
      </div>
    )
  }

  const hasKitOrders = data && data.kitOrders.length > 0
  const showEmptyState = !hasKitOrders

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

  // Tier gating: Club members can't access results (DSH-07)
  const tier = data?.tier || null
  const isClubTier = tier === 'club'

  if (isClubTier) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-display font-bold text-brand-primary mb-6">
          Blood Test Kit
        </h1>
        <div className="rounded-2xl border border-brand-primary/10 bg-white p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-sage/30 flex items-center justify-center mx-auto mb-4">
            <TestTube2 className="w-7 h-7 text-brand-primary" />
          </div>
          <h2 className="text-lg font-semibold text-brand-primary mb-2">
            Upgrade to Unlock Lab Testing
          </h2>
          <p className="text-sm text-brand-primary/60 mb-6 max-w-sm mx-auto">
            Comprehensive biomarker testing is included with Catalyst+ and Concierge memberships, or available as a $135 add-on with Core.
          </p>
          <a
            href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white rounded-full text-sm font-medium hover:bg-forest-light transition-colors"
          >
            View Plans
          </a>
        </div>
      </div>
    )
  }

  // Has kit orders -- show latest
  const latestOrder = data!.kitOrders[0]
  const lifecycleState = latestOrder.lifecycleState
  const showRegistrationForm = lifecycleState === 'shipped'
  const showResults = lifecycleState === 'results_ready'

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-brand-primary mb-6">
        {showResults ? 'Your Lab Results' : 'Blood Test Kit'}
      </h1>

      <KitTimeline
        currentState={lifecycleState}
        trackingNumber={latestOrder.tracking_number}
      />

      {!showResults && (
        <KitDetailCard
          currentState={lifecycleState}
          trackingNumber={latestOrder.tracking_number}
        />
      )}

      {showRegistrationForm && (
        <KitRegistrationForm onSuccess={loadKitData} labsEndpoint={labsEndpoint} />
      )}

      {showResults && (
        <div className="mt-6">
          <LabsResultsView resultsEndpoint={resultsEndpoint} />
        </div>
      )}
    </div>
  )
}
