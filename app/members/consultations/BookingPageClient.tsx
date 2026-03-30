'use client'

import { useState, useEffect } from 'react'
import { ConsultationTypeSelector } from '@/components/consultations/ConsultationTypeSelector'
import { TierGateConsultation } from '@/components/consultations/TierGateConsultation'
import { BookingEmbed } from '@/components/consultations/BookingEmbed'
import type { ConsultationType } from '@/lib/config/consultations'

interface BookingPageClientProps {
  email: string
}

export function BookingPageClient({ email }: BookingPageClientProps) {
  const [consultationType, setConsultationType] = useState<ConsultationType>('initial')
  const [usage, setUsage] = useState<{ used: number; limit: number | 'unlimited'; remaining: number | 'unlimited' } | null>(null)
  const [tier, setTier] = useState<string>('club')
  const [loading, setLoading] = useState(true)
  const [eligible, setEligible] = useState(false)
  const [calcomSlug, setCalcomSlug] = useState('')

  useEffect(() => {
    async function checkEligibility() {
      try {
        // Get usage
        const usageRes = await fetch('/api/consultations')
        const usageData = await usageRes.json()
        if (usageData.success) {
          setUsage(usageData.usage)
          const latestTier = usageData.consultations?.[0]?.plan_tier || 'club'
          setTier(latestTier)

          // Check booking eligibility
          const bookRes = await fetch('/api/consultations/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planTier: latestTier, consultationType }),
          })
          const bookData = await bookRes.json()
          if (bookData.success) {
            setEligible(true)
            setCalcomSlug(bookData.calcomOrgSlug)
          }
        }
      } catch {
        // Failed to check — show default state
      } finally {
        setLoading(false)
      }
    }
    checkEligibility()
  }, [consultationType])

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <p className="text-brand-primary/40">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      <section className="py-12 px-6 bg-brand-primary text-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Book a Consultation
          </h1>
          <p className="text-white/70">
            Schedule a video consultation with one of our providers.
          </p>
        </div>
      </section>

      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {usage && (
            <TierGateConsultation used={usage.used} limit={usage.limit} tier={tier} />
          )}

          {eligible && (
            <>
              <div>
                <h3 className="text-sm font-medium text-brand-primary mb-2">Consultation Type</h3>
                <ConsultationTypeSelector selected={consultationType} onChange={setConsultationType} />
              </div>

              <div className="bg-white rounded-xl border border-brand-primary/10 overflow-hidden" style={{ minHeight: 500 }}>
                <BookingEmbed
                  calLink={`${calcomSlug}/${consultationType}`}
                  consultationType={consultationType}
                  memberEmail={email}
                  planTier={tier}
                />
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
