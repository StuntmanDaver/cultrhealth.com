import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth'
import { getConsultationById, getNotesForConsultation, getRecordingForConsultation } from '@/lib/consultations-db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminAuth(request)
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const consultation = await getConsultationById(Number(id))
    if (!consultation) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    const notes = await getNotesForConsultation(Number(id), true)
    const recording = await getRecordingForConsultation(Number(id))

    return NextResponse.json({
      success: true,
      consultation,
      notes,
      recording: recording ? {
        id: recording.id,
        status: recording.status,
        durationSecs: recording.duration_secs,
        fileSizeBytes: Number(recording.file_size_bytes),
        hasRecording: recording.status === 'ready',
      } : null,
    })
  } catch (error) {
    console.error('Failed to get admin consultation detail:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
