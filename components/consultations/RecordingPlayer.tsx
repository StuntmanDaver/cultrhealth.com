'use client'

import { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'

interface RecordingPlayerProps {
  consultationId: number
}

export function RecordingPlayer({ consultationId }: RecordingPlayerProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchUrl() {
      try {
        const res = await fetch(`/api/consultations/${consultationId}/recording`)
        const data = await res.json()
        if (data.success && data.recording?.url) {
          setUrl(data.recording.url)
        } else {
          setError(data.error || 'No recording available')
        }
      } catch {
        setError('Failed to load recording')
      } finally {
        setLoading(false)
      }
    }
    fetchUrl()
  }, [consultationId])

  if (loading) {
    return <div className="text-sm text-brand-primary/40 py-4">Loading recording...</div>
  }

  if (error || !url) {
    return (
      <div className="flex items-center gap-2 text-sm text-brand-primary/40 py-4">
        <AlertCircle className="w-4 h-4" />
        {error || 'No recording available'}
      </div>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden bg-gray-900">
      <video
        src={url}
        controls
        className="w-full"
        preload="metadata"
      >
        Your browser does not support video playback.
      </video>
    </div>
  )
}
