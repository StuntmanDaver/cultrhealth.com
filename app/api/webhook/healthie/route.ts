import { NextRequest, NextResponse } from 'next/server'
import { USE_HEALTHIE } from '@/lib/config/feature-flags'
import { readWebhookBody, verifyHealthieWebhook, parseWebhookBody } from '@/lib/healthie/webhooks'
import { getClient, getAppointment, getFormAnswerGroup, getDocument } from '@/lib/healthie'
import { sql } from '@vercel/postgres'

/**
 * Healthie Webhook Handler
 *
 * Receives real-time events from Healthie EMR.
 * HIPAA: Never log webhook body contents (may contain PHI).
 *
 * Healthie event types use dot-notation (e.g. appointment.created).
 * See: https://docs.gethealthie.com/guides/webhooks/event-reference/
 */
export async function POST(request: NextRequest) {
  try {
    if (!USE_HEALTHIE) {
      return NextResponse.json({ received: true, ignored: true })
    }

    // Read body once — shared between verification and parsing
    const rawBody = await readWebhookBody(request)

    if (!verifyHealthieWebhook(request, rawBody)) {
      console.error('Healthie webhook verification failed')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const event = parseWebhookBody(rawBody)

    switch (event.event_type) {
      case 'form_answer_group.created':
      case 'form_answer_group.locked':
        await safeHandler('form', () => handleFormCompleted(event.resource_id))
        break

      case 'appointment.created':
      case 'appointment.updated':
        await safeHandler('appointment', () => handleAppointmentEvent(event.event_type, event.resource_id))
        break

      case 'document.created':
        await safeHandler('document', () => handleDocumentCreated(event.resource_id))
        break

      default:
        // Healthie sends many event types — only warn in dev
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Unhandled Healthie event type: ${event.event_type}`)
        }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Healthie webhook handler error:', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 },
    )
  }
}

/**
 * Wrap individual handlers so one failure doesn't crash the entire webhook.
 */
async function safeHandler(label: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn()
  } catch (err) {
    console.error(`Healthie webhook ${label} handler error:`, err instanceof Error ? err.message : 'unknown')
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
    console.error('Healthie form completion: missing user ID for resource', resourceId)
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
    console.error('Healthie appointment: missing user ID for resource', resourceId)
    return
  }

  const user = await getClient(healthieUserId)
  const addr = user.email?.toLowerCase()
  if (!addr) {
    console.error('Healthie appointment: user record has no contact address')
    return
  }

  if (eventType === 'appointment.created') {
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

  if (eventType === 'appointment.updated') {
    const status = appointment.pm_status
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
