import crypto from 'crypto'

const DAILY_API_URL = 'https://api.daily.co/v1'

function getApiKey(): string {
  const key = process.env.DAILY_API_KEY
  if (!key) throw new Error('DAILY_API_KEY not configured')
  return key
}

async function dailyFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${DAILY_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
      ...options.headers,
    },
  })
  if (!res.ok) {
    const body = await res.text()
    console.error(`Daily.co API error [${res.status}]: ${body}`)
    throw new Error(`Daily.co API error: ${res.status}`)
  }
  return res
}

export interface DailyRoom {
  id: string
  name: string
  url: string
  created_at: string
  config: Record<string, unknown>
}

export interface DailyMeetingToken {
  token: string
}

export async function createRoom(options: {
  name: string
  expiresAt: Date
  enableRecording: boolean
}): Promise<DailyRoom> {
  const res = await dailyFetch('/rooms', {
    method: 'POST',
    body: JSON.stringify({
      name: options.name,
      privacy: 'private',
      properties: {
        exp: Math.floor(options.expiresAt.getTime() / 1000),
        enable_recording: options.enableRecording ? 'cloud' : false,
        enable_chat: true,
        enable_screenshare: true,
        start_audio_off: false,
        start_video_off: false,
      },
    }),
  })
  return res.json()
}

export async function deleteRoom(roomName: string): Promise<void> {
  await dailyFetch(`/rooms/${roomName}`, { method: 'DELETE' })
}

export async function createMeetingToken(options: {
  roomName: string
  isOwner: boolean
  expiresAt: Date
  userName?: string
}): Promise<string> {
  const res = await dailyFetch('/meeting-tokens', {
    method: 'POST',
    body: JSON.stringify({
      properties: {
        room_name: options.roomName,
        is_owner: options.isOwner,
        exp: Math.floor(options.expiresAt.getTime() / 1000),
        user_name: options.userName,
      },
    }),
  })
  const data: DailyMeetingToken = await res.json()
  return data.token
}

export async function getRecordingDownloadLink(recordingId: string): Promise<string> {
  const res = await dailyFetch(`/recordings/${recordingId}/access-link`, {
    method: 'GET',
  })
  const data = await res.json()
  return data.download_link
}

export async function deleteRecording(recordingId: string): Promise<void> {
  await dailyFetch(`/recordings/${recordingId}`, { method: 'DELETE' })
}

export async function updateRoomRecording(roomName: string, enableRecording: boolean): Promise<void> {
  await dailyFetch(`/rooms/${roomName}`, {
    method: 'POST',
    body: JSON.stringify({
      properties: {
        enable_recording: enableRecording ? 'cloud' : false,
      },
    }),
  })
}

export function verifyDailyWebhook(payload: string, signature: string): boolean {
  const secret = process.env.DAILY_WEBHOOK_SECRET
  if (!secret) {
    console.error('DAILY_WEBHOOK_SECRET not configured')
    return false
  }
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  const sigBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)
  if (sigBuffer.length !== expectedBuffer.length) return false
  return crypto.timingSafeEqual(sigBuffer, expectedBuffer)
}
