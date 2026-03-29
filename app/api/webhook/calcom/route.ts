import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { verifyCalcomWebhook } from '@/lib/cal'
import { createRoom, createMeetingToken } from '@/lib/daily'
import {
  createConsultation,
  getConsultationByCalcomBookingId,
  updateConsultationStatus,
  getMonthlyConsultationCount,
  isWebhookProcessed,
  recordWebhookEvent,
} from '@/lib/consultations-db'
import { TIER_CONSULTATION_LIMITS, CONSULTATION_TYPES } from '@/lib/config/consultations'
import {
  sendConsultationConfirmationToPatient,
  sendConsultationNotificationToProvider,
} from '@/lib/resend'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cultrhealth.com'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('x-cal-signature-256') || ''

    if (!verifyCalcomWebhook(body, signature)) {
      console.error('Cal.com webhook signature verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)
    const eventType = event.triggerEvent as string
    const eventId = `calcom_${event.payload?.bookingId || event.payload?.uid}_${eventType}`

    if (await isWebhookProcessed(eventId)) {
      return NextResponse.json({ received: true, duplicate: true })
    }

    switch (eventType) {
      case 'BOOKING_CREATED': {
        const payload = event.payload
        const bookingId = String(payload.bookingId)
        const bookingUid = payload.uid
        const attendee = payload.attendees?.[0]
        const organizer = payload.organizer

        if (!attendee?.email) {
          console.error('Cal.com webhook: no attendee email')
          return NextResponse.json({ error: 'No attendee' }, { status: 400 })
        }

        const patientEmail = attendee.email.toLowerCase()
        const patientName = attendee.name || 'Patient'
        const providerEmail = organizer?.email?.toLowerCase() || ''
        const providerName = organizer?.name || 'Provider'
        const scheduledAt = payload.startTime
        const consultationType = payload.metadata?.consultationType || 'initial'
        const planTier = payload.metadata?.planTier || 'core'
        const reason = payload.metadata?.reason || payload.title || ''

        const tierLimit = TIER_CONSULTATION_LIMITS[planTier] ?? 0
        if (tierLimit !== Infinity) {
          const monthlyCount = await getMonthlyConsultationCount(patientEmail)
          if (monthlyCount >= tierLimit) {
            console.error('Cal.com webhook: tier consultation limit exceeded')
            await recordWebhookEvent(eventId, eventType, 'calcom')
            return NextResponse.json({ received: true, limitExceeded: true })
          }
        }

        const scheduledDate = new Date(scheduledAt)
        const roomExpiry = new Date(scheduledDate.getTime() + 2 * 60 * 60 * 1000)
        const roomName = `cultr-${bookingId}-${Date.now()}`

        const room = await createRoom({
          name: roomName,
          expiresAt: roomExpiry,
          enableRecording: true,
        })

        const providerToken = await createMeetingToken({
          roomName: room.name,
          isOwner: true,
          expiresAt: roomExpiry,
          userName: providerName,
        })

        const providerRoomUrl = `${room.url}?t=${providerToken}`

        const consultationId = await createConsultation({
          customerEmail: patientEmail,
          calcomBookingId: bookingId,
          calcomBookingUid: bookingUid,
          dailyRoomName: room.name,
          dailyRoomUrl: room.url,
          providerEmail,
          providerType: 'cultr_staff',
          consultationType,
          planTier,
          scheduledAt,
          reason,
        })

        const joinUrl = `${siteUrl}/consultations/${consultationId}`
        const cancelUrl = `${siteUrl}/consultations/${consultationId}?action=cancel`
        const typeConfig = CONSULTATION_TYPES[consultationType as keyof typeof CONSULTATION_TYPES]

        try {
          await sendConsultationConfirmationToPatient({
            patientName,
            patientEmail,
            providerName,
            consultationType: typeConfig?.label || consultationType,
            scheduledAt: scheduledDate,
            joinUrl,
            cancelUrl,
          })
        } catch (emailErr) {
          console.error('Failed to send booking confirmation email:', emailErr instanceof Error ? emailErr.message : 'Unknown error')
        }

        try {
          await sendConsultationNotificationToProvider({
            providerName,
            providerEmail,
            patientName,
            patientEmail,
            consultationType: typeConfig?.label || consultationType,
            scheduledAt: scheduledDate,
            dailyRoomUrl: providerRoomUrl,
            reason,
          })
        } catch (emailErr) {
          console.error('Failed to send provider notification:', emailErr instanceof Error ? emailErr.message : 'Unknown error')
        }

        break
      }

      case 'BOOKING_CANCELLED': {
        const bookingId = String(event.payload?.bookingId)
        const consultation = await getConsultationByCalcomBookingId(bookingId)
        if (consultation) {
          await updateConsultationStatus(consultation.id, 'cancelled', {
            cancelReason: event.payload?.cancellationReason || 'Cancelled via Cal.com',
          })
        }
        break
      }

      case 'BOOKING_RESCHEDULED': {
        const bookingId = String(event.payload?.bookingId)
        const consultation = await getConsultationByCalcomBookingId(bookingId)
        if (consultation) {
          const newScheduledAt = event.payload?.startTime
          if (newScheduledAt) {
            await updateConsultationStatus(consultation.id, 'scheduled')
            const { sql } = await import('@vercel/postgres')
            await sql`
              UPDATE consult_requests
              SET scheduled_at = ${newScheduledAt}, updated_at = NOW()
              WHERE id = ${consultation.id}
            `
          }
        }
        break
      }

      default:
        console.warn(`Unhandled Cal.com event: ${eventType}`)
    }

    await recordWebhookEvent(eventId, eventType, 'calcom')
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Cal.com webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
