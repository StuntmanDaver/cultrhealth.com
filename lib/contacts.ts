import { Resend } from 'resend'

function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  const audienceId = process.env.RESEND_AUDIENCE_ID
  if (!apiKey || !audienceId) return null
  return { client: new Resend(apiKey), audienceId }
}

interface SyncContactOptions {
  email: string
  firstName: string
  lastName: string
  phone?: string
  socialHandle?: string
  tags?: string[]
  mergeFields?: Record<string, string>
}

/**
 * Upsert a contact into the Resend audience.
 * tags and mergeFields are accepted for call-site compatibility but are not
 * stored — Resend contacts have no tag concept.
 * Non-throwing — logs errors but never rejects.
 */
export async function syncContactToResend(opts: SyncContactOptions): Promise<void> {
  const config = getResend()
  if (!config) return

  try {
    const { error } = await config.client.contacts.create({
      audienceId: config.audienceId,
      email: opts.email.trim().toLowerCase(),
      firstName: opts.firstName,
      lastName: opts.lastName,
      unsubscribed: false,
    })

    if (error) {
      console.error('[contacts] Resend sync failed:', error)
    }
  } catch (err) {
    console.error('[contacts] Resend sync error:', err)
  }
}

/**
 * Ensure a contact exists in the Resend audience when a lifecycle event occurs.
 * Resend contacts have no tag concept — the event name is logged for traceability.
 * Non-throwing — logs errors but never rejects.
 */
export async function addContactEvent(email: string, events: string[]): Promise<void> {
  const config = getResend()
  if (!config) return

  try {
    const { error } = await config.client.contacts.create({
      audienceId: config.audienceId,
      email: email.trim().toLowerCase(),
      unsubscribed: false,
    })

    if (error) {
      console.error('[contacts] Resend event contact failed:', error)
    }
  } catch (err) {
    console.error('[contacts] Resend event error:', err)
  }
}

// ---------------------------------------------------------------------------
// Back-compat aliases — callers can migrate at their own pace
// ---------------------------------------------------------------------------
export const syncContactToMailchimp = syncContactToResend
export const addTagsToContact = addContactEvent
