import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { USE_HEALTHIE } from '@/lib/config/feature-flags'

/**
 * Calendly Webhook Handler
 *
 * Receives scheduling events from Calendly and syncs them to Healthie.
 * Calendly sends events for: invitee.created, invitee.canceled
 * Signature verification uses HMAC-SHA256 via the Calendly-Webhook-Signature header.
 */
export async function POST(request: NextRequest) {
  try {
    if (!USE_HEALTHIE) {
      return NextResponse.json({ received: true, ignored: true })
    }

    const webhookSecret = process.env.CALENDLY_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('CALENDLY_WEBHOOK_SECRET not configured')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    // Calendly sends signature in format: "t=<timestamp>,v1=<signature>"
    const signatureHeader = request.headers.get('calendly-webhook-signature')
    if (!signatureHeader) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    const rawBody = await request.text()

    // Parse signature header components
    const parts = Object.fromEntries(
      signatureHeader.split(',').map(part => {
        const [key, value] = part.split('=')
        return [key, value]
      })
    )
    const timestamp = parts.t
    const receivedSignature = parts.v1

    if (!timestamp || !receivedSignature) {
      return NextResponse.json({ error: 'Invalid signature format' }, { status: 401 })
    }

    // Verify HMAC-SHA256 signature
    const payload = `${timestamp}.${rawBody}`
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex')

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(receivedSignature),
    )

    if (!isValid) {
      console.error('Calendly webhook signature verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const body = JSON.parse(rawBody)
    const eventType = body.event as string

    console.log('Calendly webhook received:', {
      event: eventType,
      timestamp: new Date().toISOString(),
    })

    switch (eventType) {
      case 'invitee.created': {
        const inviteeEmail = body.payload?.email
        const eventStartTime = body.payload?.scheduled_event?.start_time

        if (inviteeEmail && eventStartTime) {
          try {
            const { getClientByEmail, createAppointment } = await import('@/lib/healthie')
            const healthieUser = await getClientByEmail(inviteeEmail)
            if (healthieUser) {
              await createAppointment({
                user_id: healthieUser.id,
                datetime: eventStartTime,
                contact_type: 'Telehealth',
                notes: 'Booked via Calendly',
              })
            }
          } catch (healthieError) {
            console.error('Healthie appointment creation failed (non-fatal)')
          }
        }
        break
      }

      case 'invitee.canceled':
        break

      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Calendly webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
