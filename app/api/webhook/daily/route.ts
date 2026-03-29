import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { verifyDailyWebhook, getRecordingDownloadLink, deleteRecording } from '@/lib/daily'
import {
  updateConsultationStatus,
  createRecordingEntry,
  updateRecordingReady,
  updateRecordingFailed,
  isWebhookProcessed,
  recordWebhookEvent,
} from '@/lib/consultations-db'
import { buildRecordingKey, uploadRecording } from '@/lib/s3-recordings'
import { sendConsultationCompleted, sendRecordingReadyNotification } from '@/lib/resend'
import { sql } from '@vercel/postgres'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cultrhealth.com'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('x-webhook-signature') || ''

    if (!verifyDailyWebhook(body, signature)) {
      console.error('Daily.co webhook signature verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)
    const eventType = event.type as string
    const eventId = `daily_${event.event_ts || Date.now()}_${eventType}`

    if (await isWebhookProcessed(eventId)) {
      return NextResponse.json({ received: true, duplicate: true })
    }

    switch (eventType) {
      case 'meeting.ended': {
        const roomName = event.payload?.room_name
        if (!roomName) break

        const result = await sql`
          SELECT id, customer_email, provider_email, scheduled_at
          FROM consult_requests
          WHERE daily_room_name = ${roomName}
          LIMIT 1
        `
        const consultation = result.rows[0]
        if (!consultation) {
          console.error(`No consultation found for room: ${roomName}`)
          break
        }

        const startTime = event.payload?.start_ts
          ? new Date(event.payload.start_ts * 1000)
          : null
        const endTime = event.payload?.end_ts
          ? new Date(event.payload.end_ts * 1000)
          : new Date()
        const durationMins = startTime
          ? Math.round((endTime.getTime() - startTime.getTime()) / 60000)
          : null

        await updateConsultationStatus(consultation.id, 'completed', {
          durationMins,
        })

        try {
          await sendConsultationCompleted({
            patientName: consultation.customer_email.split('@')[0],
            patientEmail: consultation.customer_email,
            providerName: consultation.provider_email || 'Your provider',
            durationMins: durationMins || 0,
            notesUrl: `${siteUrl}/consultations/${consultation.id}`,
            bookFollowUpUrl: `${siteUrl}/consultations`,
          })
        } catch (emailErr) {
          console.error('Failed to send completion email:', emailErr)
        }

        break
      }

      case 'recording.ready-to-download': {
        const recordingId = event.payload?.recording_id
        const roomName = event.payload?.room_name
        if (!recordingId || !roomName) break

        const result = await sql`
          SELECT id, customer_email, provider_email
          FROM consult_requests
          WHERE daily_room_name = ${roomName}
          LIMIT 1
        `
        const consultation = result.rows[0]
        if (!consultation) {
          console.error(`No consultation found for recording room: ${roomName}`)
          break
        }

        await createRecordingEntry({
          consultationId: consultation.id,
          dailyRecordingId: recordingId,
        })

        try {
          const downloadUrl = await getRecordingDownloadLink(recordingId)
          const downloadRes = await fetch(downloadUrl)
          if (!downloadRes.ok) throw new Error(`Download failed: ${downloadRes.status}`)

          const buffer = Buffer.from(await downloadRes.arrayBuffer())
          const s3Key = buildRecordingKey(consultation.id)

          const { bucket } = await uploadRecording(s3Key, buffer, buffer.length)

          const durationSecs = event.payload?.duration
            ? Math.round(Number(event.payload.duration))
            : null
          await updateRecordingReady(
            recordingId,
            s3Key,
            bucket,
            durationSecs || 0,
            buffer.length
          )

          // Delete recording from Daily.co cloud (HIPAA: don't leave copies on third party)
          try {
            await deleteRecording(recordingId)
          } catch (delErr) {
            console.error(`Failed to delete recording ${recordingId} from Daily.co:`, delErr)
          }

          try {
            await sendRecordingReadyNotification({
              consultationId: consultation.id,
              patientName: consultation.customer_email,
              providerName: consultation.provider_email || 'Unknown',
              adminUrl: `${siteUrl}/admin/consultations/${consultation.id}`,
            })
          } catch (emailErr) {
            console.error('Failed to send recording notification:', emailErr)
          }
        } catch (err) {
          console.error(`Failed to process recording ${recordingId}:`, err)
          await updateRecordingFailed(recordingId)
        }

        break
      }

      default:
        console.warn(`Unhandled Daily.co event: ${eventType}`)
    }

    await recordWebhookEvent(eventId, eventType, 'daily')
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Daily.co webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
