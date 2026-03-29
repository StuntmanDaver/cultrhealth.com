'use client'

import { useState, useEffect } from 'react'
import { ProviderNotesForm } from '@/components/consultations/ProviderNotesForm'
import { RecordingPlayer } from '@/components/consultations/RecordingPlayer'
import { ConsultationCard } from '@/components/consultations/ConsultationCard'

interface ProviderConsultationClientProps {
  consultationId: number
}

export function ProviderConsultationClient({ consultationId }: ProviderConsultationClientProps) {
  const [consultation, setConsultation] = useState<Record<string, unknown> | null>(null)
  const [notes, setNotes] = useState<Record<string, unknown> | null>(null)
  const [hasRecording, setHasRecording] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/consultations/${consultationId}/notes`)
        const data = await res.json()
        if (data.success) setNotes(data.notes)

        const detailRes = await fetch(`/api/admin/consultations/${consultationId}`)
        const detailData = await detailRes.json()
        if (detailData.success) {
          setConsultation(detailData.consultation)
          setHasRecording(detailData.recording?.hasRecording || false)
        }
      } catch { /* ignore */ } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [consultationId])

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
          <h1 className="font-display text-3xl font-bold">Consultation #{consultationId}</h1>
        </div>
      </section>

      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {consultation && (
            <ConsultationCard consultation={consultation as never} showPatient showActions={false} />
          )}

          {hasRecording && (
            <div>
              <h3 className="font-display text-lg text-brand-primary mb-3">Recording</h3>
              <RecordingPlayer consultationId={consultationId} />
            </div>
          )}

          <div>
            <h3 className="font-display text-lg text-brand-primary mb-3">Consultation Notes</h3>
            <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
              <ProviderNotesForm
                consultationId={consultationId}
                existingNotes={notes as never}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
