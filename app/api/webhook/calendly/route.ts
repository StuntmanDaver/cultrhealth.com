import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { sql } from '@vercel/postgres'
import {
  sendConsultationConfirmationToPatient,
  sendConsultationNotificationToProvider,
} from '@/lib/resend'

/**
 * Calendly Webhook Handler
 *
 * Receives scheduling events from Calendly. On booking:
 *   - Marks member_onboarding.appointment_scheduled = TRUE
 *   - Sends confirmation to patient, support@cultrhealth.com, and admin@cultrhealth.com
 *
 * Signature verification uses HMAC-SHA256 via the Calendly-Webhook-Signature header.
 */

const PROVIDER_EMAIL = 'support@cultrhealth.com'
const ADMIN_EMAIL = 'admin@cultrhealth.com'

export async function POST(request: NextRequest) {
  try {
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

    const payload = `${timestamp}.${rawBody}`
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex')

    const expectedBuf = Buffer.from(expectedSignature)
    const receivedBuf = Buffer.from(receivedSignature)
    if (expectedBuf.length !== receivedBuf.length) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    if (!crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const body = JSON.parse(rawBody)
    const eventType = body.event as string

    switch (eventType) {
      case 'invitee.created': {
        const inviteeContact: string = body.payload?.email ?? ''
        const inviteeName: string = body.payload?.name ?? 'Patient'
        const startTime: string = body.payload?.scheduled_event?.start_time ?? ''
        const joinUrl: string = body.payload?.scheduled_event?.location?.join_url ?? ''
        const cancelUrl: string = body.payload?.cancel_url ?? ''
        const rescheduleUrl: string = body.payload?.reschedule_url ?? ''

        if (!inviteeContact || !startTime) break

        const scheduledAt = new Date(startTime)

        // Mark appointment scheduled in onboarding
        try {
          await sql`
            UPDATE member_onboarding
            SET
              appointment_scheduled = TRUE,
              step = CASE
                WHEN step IN ('schedule', 'intake', 'welcome', 'blood-test') THEN 'complete'
                ELSE step
              END,
              completed_at = NOW(),
              updated_at = NOW()
            WHERE LOWER(email) = LOWER(${inviteeContact})
          `
        } catch (dbError) {
          console.error('Calendly webhook: DB update failed (non-fatal):', dbError)
        }

        // Patient confirmation
        try {
          await sendConsultationConfirmationToPatient({
            patientName: inviteeName,
            patientEmail: inviteeContact,
            providerName: 'CULTR Health',
            consultationType: 'Telehealth Consultation',
            scheduledAt,
            joinUrl: joinUrl || rescheduleUrl,
            cancelUrl: cancelUrl || rescheduleUrl,
          })
        } catch (err) {
          console.error('Calendly webhook: confirmation email failed (non-fatal):', err)
        }

        // Provider notification
        try {
          await sendConsultationNotificationToProvider({
            providerName: 'CULTR Health Provider',
            providerEmail: PROVIDER_EMAIL,
            patientName: inviteeName,
            patientEmail: inviteeContact,
            consultationType: 'Telehealth Consultation',
            scheduledAt,
            dailyRoomUrl: joinUrl,
          })
        } catch (err) {
          console.error('Calendly webhook: provider email failed (non-fatal):', err)
        }

        // Admin notification
        try {
          await sendConsultationNotificationToProvider({
            providerName: 'Admin',
            providerEmail: ADMIN_EMAIL,
            patientName: inviteeName,
            patientEmail: inviteeContact,
            consultationType: 'Telehealth Consultation',
            scheduledAt,
            dailyRoomUrl: joinUrl,
          })
        } catch (err) {
          console.error('Calendly webhook: admin email failed (non-fatal):', err)
        }

        break
      }

      case 'invitee.canceled': {
        const inviteeContact: string = body.payload?.email ?? ''

        if (!inviteeContact) break

        // Revert so member can rebook
        try {
          await sql`
            UPDATE member_onboarding
            SET
              appointment_scheduled = FALSE,
              step = 'schedule',
              completed_at = NULL,
              updated_at = NOW()
            WHERE LOWER(email) = LOWER(${inviteeContact})
          `
        } catch (dbError) {
          console.error('Calendly webhook: DB revert failed (non-fatal):', dbError)
        }

        break
      }

      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Calendly webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
