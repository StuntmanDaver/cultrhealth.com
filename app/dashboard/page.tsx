'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MemberDashboard } from '@/components/library/MemberDashboard'
import { UserIdentifier } from '@/components/ui/UserIdentifier'

import { PLANS, type PlanTier, type LibraryAccess } from '@/lib/config/plans'

const DEFAULT_ACCESS: LibraryAccess = {
  masterIndex: 'titles_only',
  advancedProtocols: false,
  dosingCalculators: true,
  stackingGuides: false,
  providerNotes: false,
  customRequests: false,
  protocolBuilder: false,
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
              const plan = PLANS.find(p => p.slug === planTier)
              if (plan?.libraryAccess) {
                setLibraryAccess(plan.libraryAccess as LibraryAccess)
              }
            }
          }
        }
      } catch {
        // Profile fetch failed — show dashboard with defaults
      }

      setLoading(false)
    }
    fetchProfile()
  }, [])

  return (
    <div className="min-h-screen bg-brand-cream">
      {email && <UserIdentifier email={email} />}
      <header className="border-b border-brand-primary/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-display font-bold text-brand-primary">Dashboard</h1>
          <p className="text-sm text-brand-primary/50">Your orders and protocols</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <MemberDashboard
            tier={tier}
            libraryAccess={libraryAccess}
            email={email}
          />
        )}

        {/* Consultations */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg text-brand-primary">Consultations</h3>
            <Link href="/members/consultations" className="text-sm text-brand-primary/60 hover:text-brand-primary underline">
              Book consultation
            </Link>
          </div>
          <div className="bg-cream-dark rounded-xl p-4 text-center">
            <p className="text-sm text-brand-primary/60 mb-3">Schedule a consultation with your provider.</p>
            <Link
              href="/members/consultations"
              className="inline-flex px-5 py-2 bg-brand-primary text-white rounded-full text-sm font-medium hover:bg-forest-light transition-colors"
            >
              Book Now
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
