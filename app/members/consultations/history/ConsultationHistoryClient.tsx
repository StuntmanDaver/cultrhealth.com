'use client'

import { useState, useEffect } from 'react'
import { ConsultationCard, type ConsultationCardData } from '@/components/consultations/ConsultationCard'
import Link from 'next/link'

export function ConsultationHistoryClient() {
  const [consultations, setConsultations] = useState<ConsultationCardData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch('/api/consultations')
        const data = await res.json()
        if (data.success) setConsultations(data.consultations)
      } catch { /* ignore */ } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  return (
    <div className="min-h-screen bg-brand-cream">
      <section className="py-12 px-6 bg-brand-primary text-white">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold mb-1">Consultation History</h1>
            <p className="text-white/70">Your past and upcoming consultations.</p>
          </div>
          <Link
            href="/members/consultations"
            className="px-5 py-2 bg-white/10 text-white rounded-full text-sm font-medium hover:bg-white/20 transition-colors"
          >
            Book New
          </Link>
        </div>
      </section>

      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto space-y-3">
          {loading ? (
            <p className="text-brand-primary/40 text-center py-8">Loading...</p>
          ) : consultations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-brand-primary/40 mb-4">No consultations yet.</p>
              <Link
                href="/members/consultations"
                className="inline-flex px-6 py-2.5 bg-brand-primary text-white rounded-full text-sm font-medium hover:bg-forest-light transition-colors"
              >
                Book Your First
              </Link>
            </div>
          ) : (
            consultations.map((c) => (
              <ConsultationCard key={c.id} consultation={c} />
            ))
          )}
        </div>
      </section>
    </div>
  )
}
