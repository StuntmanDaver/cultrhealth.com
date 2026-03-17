'use client'

import { useState, useEffect } from 'react'
import { MemberDashboard } from '@/components/library/MemberDashboard'
import type { PlanTier, LibraryAccess } from '@/lib/config/plans'

const DEFAULT_ACCESS: LibraryAccess = {
  masterIndex: 'titles_only',
  advancedProtocols: false,
  dosingCalculators: false,
  stackingGuides: false,
  providerNotes: false,
  customRequests: false,
}

export default function DashboardPage() {
  const [tier, setTier] = useState<PlanTier | null>(null)
  const [email, setEmail] = useState('')
  const [libraryAccess, setLibraryAccess] = useState<LibraryAccess>(DEFAULT_ACCESS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/member/profile')
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            setEmail(data.patient?.email || '')
            const planTier = data.membership?.plan_tier as PlanTier | null
            setTier(planTier)
            if (planTier) {
              const { getLibraryAccess } = await import('@/lib/auth')
              setLibraryAccess(getLibraryAccess(planTier))
            }
          }
        }
      } catch {
        // Profile fetch failed — show dashboard with defaults
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Your orders and protocols</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <MemberDashboard
            tier={tier}
            libraryAccess={libraryAccess}
            email={email}
          />
        )}
      </main>
    </div>
  )
}
