import * as crypto from 'crypto'

function getConfig() {
  const apiKey = process.env.MAILCHIMP_API_KEY
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID
  const serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX
  if (!apiKey || !audienceId || !serverPrefix) return null
  return { apiKey, audienceId, serverPrefix }
}

function getAuthHeader(apiKey: string): string {
  return `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`
}

/** MD5 hash of lowercase, trimmed email — Mailchimp's subscriber key. */
export function getEmailHash(email: string): string {
  return crypto
    .createHash('md5')
    .update(email.trim().toLowerCase())
    .digest('hex')
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
 * Upsert a contact in Mailchimp with merge fields and tags.
 * Non-throwing — logs errors but never rejects.
 */
export async function syncContactToMailchimp(opts: SyncContactOptions): Promise<void> {
  const config = getConfig()
  if (!config) return

  const emailHash = getEmailHash(opts.email)
  const url = `https://${config.serverPrefix}.api.mailchimp.com/3.0/lists/${config.audienceId}/members/${emailHash}`

  const mergeFields: Record<string, string> = {
    FNAME: opts.firstName,
    LNAME: opts.lastName,
    ...(opts.phone ? { PHONE: opts.phone } : {}),
    ...(opts.socialHandle ? { MMERGE5: opts.socialHandle } : {}),
    ...opts.mergeFields,
  }

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': getAuthHeader(config.apiKey),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: opts.email.trim().toLowerCase(),
        status_if_new: 'subscribed',
        merge_fields: mergeFields,
        ...(opts.tags?.length ? { tags: opts.tags } : {}),
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[mailchimp] Sync failed:', { error })
    }
  } catch (err) {
    console.error('[mailchimp] Sync error:', err)
  }
}

/**
 * Add tags to an existing contact. Use this when you only need to
 * tag (not upsert) — e.g. intake-complete, labs-results-ready.
 * Non-throwing — logs errors but never rejects.
 */
export async function addTagsToContact(email: string, tags: string[]): Promise<void> {
  const config = getConfig()
  if (!config) return

  const emailHash = getEmailHash(email)
  const url = `https://${config.serverPrefix}.api.mailchimp.com/3.0/lists/${config.audienceId}/members/${emailHash}/tags`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(config.apiKey),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tags: tags.map(name => ({ name, status: 'active' })),
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[mailchimp] Tag failed:', { tags, error })
    }
  } catch (err) {
    console.error('[mailchimp] Tag error:', err)
  }
}
