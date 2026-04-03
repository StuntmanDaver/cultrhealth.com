import { NextRequest, NextResponse } from 'next/server'
import { verifyHealthieWebhook, parseWebhookBody } from '@/lib/healthie/webhooks'

/**
 * Healthie Webhook Handler
 *
 * Receives real-time events from Healthie EMR.
 * HIPAA: Never log webhook body contents (may contain PHI).
 *
 * Common event types:
 * - FormAnswerGroupCompleted: Intake form completed
 * - AppointmentCreated: New appointment booked
 * - AppointmentUpdated: Appointment status changed
 * - DocumentCreated: New document uploaded
 */
export async function POST(request: NextRequest) {
  try {
    if (!verifyHealthieWebhook(request)) {
      console.error('Healthie webhook verification failed')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const event = await parseWebhookBody(request)

    console.log('Healthie webhook received:', {
      event_type: event.event_type,
      resource_id: event.resource_id,
      timestamp: new Date().toISOString(),
    })

    switch (event.event_type) {
      case 'FormAnswerGroupCompleted':
        await handleFormCompleted(event.resource_id)
        break

      case 'AppointmentCreated':
      case 'AppointmentUpdated':
        await handleAppointmentEvent(event.event_type, event.resource_id)
        break

      case 'DocumentCreated':
        await handleDocumentCreated(event.resource_id)
        break

      default:
        console.log(`Unhandled Healthie event type: ${event.event_type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Healthie webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 },
    )
  }
}

async function handleFormCompleted(_resourceId: string) {
  // TODO: Update onboarding step when intake form completed
}

async function handleAppointmentEvent(_eventType: string, _resourceId: string) {
  // TODO: Track appointment status changes
}

async function handleDocumentCreated(_resourceId: string) {
  // TODO: Handle new documents (e.g., lab results pushed from SiPhox)
}
