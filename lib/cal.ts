import crypto from 'crypto'

const CALCOM_API_URL = 'https://api.cal.com/v2'

function getApiKey(): string {
  const key = process.env.CALCOM_API_KEY
  if (!key) throw new Error('CALCOM_API_KEY not configured')
  return key
}

async function calFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${CALCOM_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'cal-api-version': '2024-08-13',
      Authorization: `Bearer ${getApiKey()}`,
      ...options.headers,
    },
  })
  if (!res.ok) {
    const body = await res.text()
    console.error(`Cal.com API error [${res.status}]: ${body}`)
    throw new Error(`Cal.com API error: ${res.status}`)
  }
  return res
}

export interface CalcomBooking {
  id: number
  uid: string
  title: string
  startTime: string
  endTime: string
  attendees: Array<{ email: string; name: string }>
  organizer: { email: string; name: string }
  status: string
  meetingUrl?: string
}

export async function getEventTypes(): Promise<Array<{ id: number; slug: string; title: string; length: number }>> {
  const res = await calFetch('/event-types')
  const data = await res.json()
  return data.data || []
}

export async function getBooking(bookingUid: string): Promise<CalcomBooking> {
  const res = await calFetch(`/bookings/${bookingUid}`)
  const data = await res.json()
  return data.data
}

export async function cancelBooking(bookingUid: string, cancellationReason?: string): Promise<void> {
  await calFetch(`/bookings/${bookingUid}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ cancellationReason }),
  })
}

export function verifyCalcomWebhook(payload: string, signature: string): boolean {
  const secret = process.env.CALCOM_WEBHOOK_SECRET
  if (!secret) {
    console.error('CALCOM_WEBHOOK_SECRET not configured')
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
