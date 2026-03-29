import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, isProviderEmail } from '@/lib/auth'
import { getConsultationById, getRecordingForConsultation } from '@/lib/consultations-db'
import { getRecordingPresignedUrl } from '@/lib/s3-recordings'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated || !auth.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    if (!isProviderEmail(auth.email)) {
      return NextResponse.json({ success: false, error: 'Provider access required' }, { status: 403 })
    }

    const { id } = await params
    const consultation = await getConsultationById(Number(id))
    if (!consultation) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    const recording = await getRecordingForConsultation(Number(id))
    if (!recording || !recording.s3_key) {
      return NextResponse.json({ success: false, error: 'No recording available' }, { status: 404 })
    }

    const presignedUrl = await getRecordingPresignedUrl(recording.s3_key, 3600)

    return NextResponse.json({
      success: true,
      recording: {
        id: recording.id,
        durationSecs: recording.duration_secs,
        fileSizeBytes: Number(recording.file_size_bytes),
        url: presignedUrl,
        expiresIn: 3600,
      },
    })
  } catch (error) {
    console.error('Failed to get recording:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
