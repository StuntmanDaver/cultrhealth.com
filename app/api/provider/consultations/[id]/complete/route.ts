import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, isProviderEmail } from '@/lib/auth'
import { getConsultationById, updateConsultationStatus, upsertConsultationNotes } from '@/lib/consultations-db'

export async function POST(
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

    const body = await request.json()

    if (consultation.status !== 'completed') {
      await updateConsultationStatus(consultation.id, 'completed', {
        durationMins: body.durationMins,
      })
    }

    if (body.reason || body.outcome || body.nextSteps || body.internalNotes) {
      await upsertConsultationNotes({
        consultationId: consultation.id,
        providerEmail: auth.email,
        reason: body.reason,
        outcome: body.outcome,
        nextSteps: body.nextSteps,
        internalNotes: body.internalNotes,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to complete consultation:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
