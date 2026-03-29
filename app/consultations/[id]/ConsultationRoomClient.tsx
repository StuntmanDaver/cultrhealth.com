'use client'

import { useState, useEffect, useCallback } from 'react'
import { WaitingRoom } from '@/components/consultations/WaitingRoom'
import { VideoRoom } from '@/components/consultations/VideoRoom'
import { PostCallSummary } from '@/components/consultations/PostCallSummary'

type RoomState = 'loading' | 'countdown' | 'waiting' | 'in_call' | 'post_call' | 'error'

interface ConsultationRoomClientProps {
  consultationId: number
}

export function ConsultationRoomClient({ consultationId }: ConsultationRoomClientProps) {
  const [state, setState] = useState<RoomState>('loading')
  const [consultation, setConsultation] = useState<Record<string, unknown> | null>(null)
  const [meetingToken, setMeetingToken] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchConsultation() {
      try {
        const res = await fetch(`/api/consultations/${consultationId}`)
        const data = await res.json()
        if (!data.success) {
          setError(data.error || 'Failed to load consultation')
          setState('error')
          return
        }

        setConsultation(data.consultation)
        setMeetingToken(data.meetingToken)
        setNotes(data.notes)

        if (data.consultation.status === 'completed') {
          setState('post_call')
          return
        }

        if (data.consultation.status === 'cancelled') {
          setError('This consultation has been cancelled.')
          setState('error')
          return
        }

        const scheduledAt = new Date(data.consultation.scheduled_at)
        const minutesUntil = (scheduledAt.getTime() - Date.now()) / 60000

        if (minutesUntil > 10) {
          setState('countdown')
        } else {
          setState('waiting')
        }
      } catch {
        setError('Failed to load consultation')
        setState('error')
      }
    }
    fetchConsultation()
  }, [consultationId])

  const handleJoin = useCallback(async (consentGiven: boolean) => {
    await fetch(`/api/consultations/${consultationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordingConsent: consentGiven }),
    })
    setState('in_call')
  }, [consultationId])

  const handleLeave = useCallback(() => {
    setState('post_call')
  }, [])

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <p className="text-brand-primary/40">Loading consultation...</p>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <a href="/consultations" className="text-sm text-brand-primary underline">Back to consultations</a>
        </div>
      </div>
    )
  }

  if (state === 'countdown') {
    const scheduledAt = new Date(String(consultation?.scheduled_at))
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h2 className="font-display text-2xl text-brand-primary mb-2">Your Consultation</h2>
          <p className="text-brand-primary/60 mb-6">
            Scheduled for {scheduledAt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at{' '}
            {scheduledAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </p>
          <p className="text-sm text-brand-primary/40">
            The waiting room will open 10 minutes before your appointment.
          </p>
        </div>
      </div>
    )
  }

  if (state === 'waiting') {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center px-6 py-12">
        <WaitingRoom
          providerName={String(consultation?.provider_email || 'Your provider')}
          scheduledAt={new Date(String(consultation?.scheduled_at))}
          onJoin={handleJoin}
        />
      </div>
    )
  }

  if (state === 'in_call' && consultation?.daily_room_url && meetingToken) {
    return (
      <div className="h-screen bg-gray-900 p-4">
        <VideoRoom
          roomUrl={String(consultation.daily_room_url)}
          token={meetingToken}
          userName={String(consultation.customer_email).split('@')[0]}
          onLeave={handleLeave}
        />
      </div>
    )
  }

  if (state === 'post_call') {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center px-6 py-12">
        <PostCallSummary
          consultationId={consultationId}
          providerName={String(consultation?.provider_email || 'Your provider')}
          durationMins={consultation?.duration_mins as number | null}
          hasNotes={!!notes}
        />
      </div>
    )
  }

  return null
}
