import { NextRequest, NextResponse } from 'next/server'
import { verifyHealthieWebhook, parseWebhookBody } from '@/lib/healthie/webhooks'
import { getClient, getAppointment, getFormAnswerGroup, getDocument } from '@/lib/healthie'
import { sql } from '@vercel/postgres'

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
        console.warn(`Unhandled Healthie event type: ${event.event_type}`)
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

/**
 * Handle completed intake form.
 * Updates member_onboarding: intake_completed = true, advances step.
 */
async function handleFormCompleted(resourceId: string) {
  const formGroup = await getFormAnswerGroup(resourceId)

  if (!formGroup.finished) {
    return
  }

  const healthieUserId = formGroup.user?.id
  if (!healthieUserId) {
    console.error('FormAnswerGroupCompleted missing user ID:', resourceId)
    return
  }

  const user = await getClient(healthieUserId)
  const addr = user.email?.toLowerCase()
  if (!addr) {
    console.error('Healthie form completion: user record has no contact address')
    return
  }

  await sql`
    UPDATE member_onboarding
    SET intake_completed = TRUE,
        healthie_patient_id = ${healthieUserId},
        step = CASE
          WHEN step IN ('intake', 'welcome', 'blood-test') THEN 'schedule'
          ELSE step
        END,
        updated_at = NOW()
    WHERE LOWER(email) = ${addr}
  `
}

/**
 * Handle appointment created/updated events.
 * Created: marks onboarding appointment_scheduled, advances to complete.
 * Updated with Cancelled/No-Show: reverts onboarding step.
 */
async function handleAppointmentEvent(eventType: string, resourceId: string) {
  const appointment = await getAppointment(resourceId)

  const healthieUserId = appointment.user?.id
  if (!healthieUserId) {
    console.error('Appointment webhook missing user ID:', resourceId)
    return
  }

  const user = await getClient(healthieUserId)
  const addr = user.email?.toLowerCase()
  if (!addr) {
    console.error('Healthie appointment: user record has no contact address')
    return
  }

  if (eventType === 'AppointmentCreated') {
    await sql`
      UPDATE member_onboarding
      SET appointment_scheduled = TRUE,
          healthie_patient_id = ${healthieUserId},
          step = CASE
            WHEN step IN ('schedule', 'intake', 'welcome', 'blood-test') THEN 'complete'
            ELSE step
          END,
          completed_at = CASE
            WHEN step IN ('schedule', 'intake', 'welcome', 'blood-test') THEN NOW()
            ELSE completed_at
          END,
          updated_at = NOW()
      WHERE LOWER(email) = ${addr}
    `
  }

  if (eventType === 'AppointmentUpdated') {
    const status = appointment.status
    if (status === 'Cancelled' || status === 'No-Show') {
      await sql`
        UPDATE member_onboarding
        SET appointment_scheduled = FALSE,
            step = 'schedule',
            completed_at = NULL,
            updated_at = NOW()
        WHERE LOWER(email) = ${addr}
          AND step = 'complete'
      `
    }
  }
}

/**
 * Handle new document creation.
 * SiPhox cron handles lab result processing separately.
 */
async function handleDocumentCreated(resourceId: string) {
  const doc = await getDocument(resourceId)

  if (!doc.rel_user_id) {
    return
  }

  // No further action needed — SiPhox cron processes lab results independently
}
