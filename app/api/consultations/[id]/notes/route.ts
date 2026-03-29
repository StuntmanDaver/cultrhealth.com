import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, isProviderEmail } from '@/lib/auth'
import { getConsultationById, getNotesForConsultation, upsertConsultationNotes } from '@/lib/consultations-db'

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

    const isProvider = isProviderEmail(auth.email)
    const isMember = consultation.customer_email.toLowerCase() === auth.email.toLowerCase()

    if (!isProvider && !isMember) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const notes = await getNotesForConsultation(Number(id), isProvider)
    return NextResponse.json({ success: true, notes })
  } catch (error) {
    console.error('Failed to get notes:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

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
    const noteId = await upsertConsultationNotes({
      consultationId: Number(id),
      providerEmail: auth.email,
      reason: body.reason,
      outcome: body.outcome,
      nextSteps: body.nextSteps,
      internalNotes: body.internalNotes,
    })

    return NextResponse.json({ success: true, noteId })
  } catch (error) {
    console.error('Failed to save notes:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
