'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, Mic, MicOff, VideoOff } from 'lucide-react'
import { RECORDING_CONSENT_TEXT } from '@/lib/config/consultations'

interface WaitingRoomProps {
  providerName: string
  scheduledAt: Date
  onJoin: (consentGiven: boolean) => void
}

export function WaitingRoom({ providerName, scheduledAt, onJoin }: WaitingRoomProps) {
  const [consent, setConsent] = useState(false)
  const [cameraOn, setCameraOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [timeUntil, setTimeUntil] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    async function startPreview() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err) {
        console.error('Camera/mic access error:', err)
      }
    }
    startPreview()

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = scheduledAt.getTime() - Date.now()
      if (diff <= 0) {
        setTimeUntil('Starting now')
      } else {
        const mins = Math.floor(diff / 60000)
        const secs = Math.floor((diff % 60000) / 1000)
        setTimeUntil(`${mins}m ${secs}s`)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [scheduledAt])

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(t => (t.enabled = cameraOn))
    }
  }, [cameraOn])

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => (t.enabled = micOn))
    }
  }, [micOn])

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="font-display text-2xl text-brand-primary mb-2 text-center">
        Waiting Room
      </h2>
      <p className="text-sm text-brand-primary/60 text-center mb-6">
        Your consultation with {providerName} starts in {timeUntil}
      </p>

      {/* Camera preview */}
      <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden mb-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${!cameraOn ? 'hidden' : ''}`}
        />
        {!cameraOn && (
          <div className="absolute inset-0 flex items-center justify-center">
            <VideoOff className="w-12 h-12 text-white/40" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <button
          onClick={() => setMicOn(!micOn)}
          className={`p-3 rounded-full transition-colors ${micOn ? 'bg-brand-primary/10 text-brand-primary' : 'bg-red-100 text-red-600'}`}
        >
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        <button
          onClick={() => setCameraOn(!cameraOn)}
          className={`p-3 rounded-full transition-colors ${cameraOn ? 'bg-brand-primary/10 text-brand-primary' : 'bg-red-100 text-red-600'}`}
        >
          {cameraOn ? <Camera className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>
      </div>

      {/* Recording consent */}
      <div className="bg-cream-dark rounded-xl p-4 mb-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-brand-primary/30 text-brand-primary focus:ring-brand-primary"
          />
          <span className="text-sm text-brand-primary/80">{RECORDING_CONSENT_TEXT}</span>
        </label>
      </div>

      <button
        onClick={() => onJoin(consent)}
        className="w-full py-3 bg-brand-primary text-white rounded-full font-medium hover:bg-forest-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Join Consultation
      </button>
      {!consent && (
        <p className="text-xs text-brand-primary/40 text-center mt-2">
          You can join without consent — recording will be disabled.
        </p>
      )}
    </div>
  )
}
