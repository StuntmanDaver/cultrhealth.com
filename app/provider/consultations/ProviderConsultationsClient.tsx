'use client'

import { useState, useEffect } from 'react'
import { ConsultationCard, type ConsultationCardData } from '@/components/consultations/ConsultationCard'

interface ProviderConsultationsClientProps {
  providerEmail: string
}

export function ProviderConsultationsClient({ providerEmail }: ProviderConsultationsClientProps) {
  const [upcoming, setUpcoming] = useState<ConsultationCardData[]>([])
  const [past, setPast] = useState<ConsultationCardData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [upRes, allRes] = await Promise.all([
          fetch('/api/provider/consultations?upcoming=true'),
          fetch('/api/provider/consultations'),
        ])
        const upData = await upRes.json()
        const allData = await allRes.json()
        if (upData.success) setUpcoming(upData.consultations)
        if (allData.success) setPast(allData.consultations.filter((c: ConsultationCardData) => c.status === 'completed'))
      } catch { /* ignore */ } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-brand-primary/40">Loading...</p>
      </div>
    )
  }

  return (
    <div>
      <section className="py-8 px-6 border-b border-brand-primary/10">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-2xl font-bold text-brand-primary mb-1">Provider Schedule</h1>
          <p className="text-sm text-brand-primary/50">{providerEmail}</p>
        </div>
      </section>

      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h2 className="font-display text-xl text-brand-primary mb-3">Upcoming ({upcoming.length})</h2>
            <div className="space-y-3">
              {upcoming.length === 0 ? (
                <p className="text-sm text-brand-primary/40">No upcoming consultations.</p>
              ) : (
                upcoming.map((c) => (
                  <ConsultationCard key={c.id} consultation={c} showPatient />
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl text-brand-primary mb-3">Completed ({past.length})</h2>
            <div className="space-y-3">
              {past.length === 0 ? (
                <p className="text-sm text-brand-primary/40">No completed consultations yet.</p>
              ) : (
                past.map((c) => (
                  <ConsultationCard key={c.id} consultation={c} showPatient />
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
