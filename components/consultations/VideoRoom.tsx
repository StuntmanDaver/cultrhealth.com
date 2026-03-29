'use client'

import { useEffect, useState } from 'react'
import DailyIframe from '@daily-co/daily-js'
import { DailyProvider, DailyVideo, useLocalSessionId, useParticipantIds, useMeetingState, useDaily } from '@daily-co/daily-react'
import { Mic, MicOff, Camera, VideoOff, PhoneOff, Monitor } from 'lucide-react'

interface VideoRoomProps {
  roomUrl: string
  token: string
  userName: string
  onLeave: () => void
}

function CallUI({ onLeave }: { onLeave: () => void }) {
  const daily = useDaily()
  const localSessionId = useLocalSessionId()
  const participantIds = useParticipantIds()
  const meetingState = useMeetingState()
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (meetingState === 'left-meeting') {
      onLeave()
    }
  }, [meetingState, onLeave])

  const toggleMic = () => {
    daily?.setLocalAudio(!micOn)
    setMicOn(!micOn)
  }

  const toggleCam = () => {
    daily?.setLocalVideo(!camOn)
    setCamOn(!camOn)
  }

  const toggleScreen = async () => {
    try {
      await daily?.startScreenShare()
    } catch {
      // User cancelled or not supported
    }
  }

  const leave = () => {
    daily?.leave()
    onLeave()
  }

  const mins = Math.floor(elapsed / 60)
  const secs = String(elapsed % 60).padStart(2, '0')

  const remoteIds = participantIds.filter(id => id !== localSessionId)

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-xl overflow-hidden">
      {/* Remote video (main) */}
      <div className="w-full h-full">
        {remoteIds.length > 0 ? (
          <DailyVideo sessionId={remoteIds[0]} type="video" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div className="flex items-center justify-center h-full text-white/40 text-sm">
            Waiting for provider to join...
          </div>
        )}
      </div>

      {/* Local video (picture-in-picture) */}
      {localSessionId && (
        <div className="absolute bottom-20 right-4 w-40 aspect-video rounded-lg overflow-hidden border-2 border-white/20 shadow-lg">
          <DailyVideo sessionId={localSessionId} type="video" mirror style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-4 left-4 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/cultr-logo-green.svg" alt="CULTR" className="h-6 opacity-80" style={{ filter: 'brightness(0) invert(1)' }} />
        <span className="text-white/60 text-sm font-mono">{mins}:{secs}</span>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
        <button onClick={toggleMic} className={`p-3 rounded-full ${micOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white'}`}>
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        <button onClick={toggleCam} className={`p-3 rounded-full ${camOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white'}`}>
          {camOn ? <Camera className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>
        <button onClick={toggleScreen} className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20">
          <Monitor className="w-5 h-5" />
        </button>
        <button onClick={leave} className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600">
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

export function VideoRoom({ roomUrl, token, userName, onLeave }: VideoRoomProps) {
  const [callObject, setCallObject] = useState<ReturnType<typeof DailyIframe.createCallObject> | null>(null)

  useEffect(() => {
    const co = DailyIframe.createCallObject({
      url: roomUrl,
      token,
      userName,
    })
    setCallObject(co)
    co.join()

    return () => {
      co.leave()
      co.destroy()
    }
  }, [roomUrl, token, userName])

  if (!callObject) {
    return (
      <div className="flex items-center justify-center h-full text-brand-primary/40">
        Connecting...
      </div>
    )
  }

  return (
    <DailyProvider callObject={callObject}>
      <CallUI onLeave={onLeave} />
    </DailyProvider>
  )
}
