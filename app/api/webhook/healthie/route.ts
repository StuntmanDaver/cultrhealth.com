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

      case 'payment.failed':
        await safeHandler('payment_failed', () => handlePaymentFailed(event.resource_id))
        break

      case 'appointment.completed':
        await safeHandler('appointment_completed', () => handleAppointmentCompleted(event.resource_id))
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
  // NOTE: no provider alert here. This handler fires for EVERY Healthie
  // form_answer_group (consent, follow-up, check-in forms — not just intake),
  // so alerting here would spam the ops team. The intake-review alert is
  // sent from /api/intake/submit, which fires once per actual intake.
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
    // Guard on the FALSE→TRUE transition: the Healthie webhook has no event
    // idempotency, so a retried delivery would otherwise re-send the booking
    // confirmation. A cancellation resets the flag, so a genuine re-book still
    // produces a fresh confirmation.
    const onboardingUpdate = await sql`
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
        AND appointment_scheduled IS DISTINCT FROM TRUE
    `

    // Send the booking confirmation + education-drip tags only on the first
    // transition. Non-fatal.
    if (onboardingUpdate.rowCount && onboardingUpdate.rowCount > 0) {
      try {
        const patientName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Member'
        const providerName = appointment.provider
          ? [appointment.provider.first_name, appointment.provider.last_name].filter(Boolean).join(' ')
          : ''
        const contactType = (appointment.contact_type || '').toLowerCase()
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cultrhealth.com'
        // Guard against a malformed Healthie date string so the confirmation
        // email never renders "Invalid Date".
        const parsedDate = appointment.date ? new Date(appointment.date) : new Date()
        const appointmentDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate
        const { sendBookingConfirmation } = await import('@/lib/resend')
        await sendBookingConfirmation({
          name: patientName,
          email: addr,
          appointmentType: appointment.appointment_type?.name || 'Consultation',
          appointmentDate,
          providerName: providerName || undefined,
          dashboardUrl: `${siteUrl}/members`,
          // Healthie's confirmation template is binary (video vs in-person);
          // treat anything not explicitly in-person as a video visit, since
          // CULTR is a telehealth practice.
          isVideo: contactType ? !contactType.includes('person') : true,
        })
        const { addTagsToContact } = await import('@/lib/contacts')
        await addTagsToContact(addr, ['appointment-booked', 'onboarding-complete'])
      } catch (notifyError) {
        console.error(
          'Healthie appointment notify error (non-fatal):',
          notifyError instanceof Error ? notifyError.message : 'unknown'
        )
      }
    }
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

/**
 * Handle payment.failed event.
 * Flags member_onboarding payment status and fires a non-PHI signal to Zapier.
 * HIPAA: no patient details are forwarded to Zapier.
 */
async function handlePaymentFailed(resourceId: string) {
  const user = await getClient(resourceId)
  const addr = user?.email?.toLowerCase()
  if (!addr) return

  await sql`
    UPDATE member_onboarding
    SET payment_failed = TRUE, updated_at = NOW()
    WHERE LOWER(email) = ${addr}
  `

  const zapierUrl = process.env.ZAPIER_HEALTHIE_EVENT_URL
  if (zapierUrl) {
    const { fireZapierWebhook } = await import('@/lib/zapier')
    await fireZapierWebhook(zapierUrl, 'healthie_payment_failed', { source: 'healthie' })
  }
}

/**
 * Handle appointment.completed event.
 * Logs a billing/documentation note; does not write PHI outside Healthie.
 */
async function handleAppointmentCompleted(resourceId: string) {
  const appointment = await getAppointment(resourceId)
  const healthieUserId = appointment.user?.id
  if (!healthieUserId) return

  const user = await getClient(healthieUserId)
  const addr = user?.email?.toLowerCase()
  if (!addr) return

  await sql`
    UPDATE member_onboarding
    SET appointment_completed = TRUE, updated_at = NOW()
    WHERE LOWER(email) = ${addr}
  `
}
