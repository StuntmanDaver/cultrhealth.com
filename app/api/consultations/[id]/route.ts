import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { getConsultationById, getNotesForConsultation, updateRecordingConsent } from '@/lib/consultations-db'
import { createMeetingToken, updateRoomRecording } from '@/lib/daily'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated || !auth.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params
    const consultation = await getConsultationById(Number(id))
    if (!consultation) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    if (consultation.customer_email.toLowerCase() !== auth.email.toLowerCase()) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    let meetingToken: string | null = null
    if (consultation.daily_room_name && consultation.status === 'scheduled') {
      try {
        const scheduledAt = new Date(consultation.scheduled_at || Date.now())
        const tokenExpiry = new Date(scheduledAt.getTime() + 2 * 60 * 60 * 1000)
        meetingToken = await createMeetingToken({
          roomName: consultation.daily_room_name,
          isOwner: false,
          expiresAt: tokenExpiry,
          userName: consultation.customer_email.split('@')[0],
        })
      } catch (tokenErr) {
        console.error('Failed to generate meeting token:', tokenErr)
      }
    }

    const notes = await getNotesForConsultation(Number(id), false)

    return NextResponse.json({
      success: true,
      consultation: {
        ...consultation,
        daily_room_name: undefined,
        daily_room_url: undefined,
      },
      meetingToken,
      notes,
    })
  } catch (error) {
    console.error('Failed to get consultation:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated || !auth.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params
    const consultation = await getConsultationById(Number(id))
    if (!consultation) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    if (consultation.customer_email.toLowerCase() !== auth.email.toLowerCase()) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    if (typeof body.recordingConsent === 'boolean') {
      await updateRecordingConsent(Number(id), body.recordingConsent)

      // If consent declined, disable recording on the Daily.co room
      if (!body.recordingConsent && consultation.daily_room_name) {
        try {
          await updateRoomRecording(consultation.daily_room_name, false)
        } catch (roomErr) {
          console.error('Failed to disable room recording:', roomErr)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update consultation:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
