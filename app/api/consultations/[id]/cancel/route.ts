import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { getConsultationById, updateConsultationStatus } from '@/lib/consultations-db'
import { cancelBooking } from '@/lib/cal'

export async function POST(
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

    if (consultation.status !== 'scheduled') {
      return NextResponse.json(
        { success: false, error: 'Only scheduled consultations can be cancelled' },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const reason = body.reason || 'Cancelled by member'

    if (consultation.calcom_booking_uid) {
      try {
        await cancelBooking(consultation.calcom_booking_uid, reason)
      } catch (calErr) {
        console.error('Failed to cancel Cal.com booking:', calErr)
      }
    }

    await updateConsultationStatus(consultation.id, 'cancelled', { cancelReason: reason })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to cancel consultation:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
