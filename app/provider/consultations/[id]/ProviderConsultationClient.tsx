'use client'

import { useState, useEffect } from 'react'
import { ProviderNotesForm } from '@/components/consultations/ProviderNotesForm'
import { RecordingPlayer } from '@/components/consultations/RecordingPlayer'
import { ConsultationCard, type ConsultationCardData } from '@/components/consultations/ConsultationCard'

interface ProviderConsultationClientProps {
  consultationId: number
}

export function ProviderConsultationClient({ consultationId }: ProviderConsultationClientProps) {
  const [consultation, setConsultation] = useState<ConsultationCardData | null>(null)
  const [notes, setNotes] = useState<{ reason?: string | null; outcome?: string | null; next_steps?: string | null; internal_notes?: string | null } | null>(null)
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
      <div className="flex items-center justify-center py-20">
        <p className="text-brand-primary/40">Loading...</p>
      </div>
    )
  }

  return (
    <div>
      <section className="py-8 px-6 border-b border-brand-primary/10">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-2xl font-bold text-brand-primary">Consultation #{consultationId}</h1>
        </div>
      </section>

      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {consultation && (
            <ConsultationCard consultation={consultation} showPatient showActions={false} />
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
                existingNotes={notes || undefined}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
