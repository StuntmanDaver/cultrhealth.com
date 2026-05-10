import { SignJWT } from 'jose'
import { config as loadEnv } from 'dotenv'
import { sql } from '@vercel/postgres'

loadEnv({ path: '.env.local' })

const STAGING_BASE_URL =
  process.env.STAGING_BASE_URL ||
  'https://cultrhealth-git-staging-stuntmandavers-projects.vercel.app'
const TRACKING_BASE_URL =
  process.env.TRACKING_BASE_URL ||
  'https://staging.cultrclub.com'
const TRACKING_FALLBACK_BASE_URL = 'https://cultrclub.com'
const RESEND_API_URL = 'https://api.resend.com'
const LOGIN_SUBJECT = 'Access Your CULTR Creator Portal'

function requiredEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}

function maskEmail(email) {
  const [user, domain] = String(email).split('@')
  return `${user.slice(0, 2)}***@${domain}`
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function resendFetch(path, init = {}) {
  const response = await fetch(`${RESEND_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${requiredEnv('RESEND_API_KEY')}`,
      ...(init.headers || {}),
    },
  })
  const text = await response.text()
  let body = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  if (!response.ok) {
    throw new Error(`Resend ${path} failed with ${response.status}: ${text}`)
  }
  return body
}

async function getCreatorFixtures() {
  const activeEmail = process.env.TEST_ACTIVE_CREATOR_EMAIL?.trim().toLowerCase()
  const pendingEmail = process.env.TEST_PENDING_CREATOR_EMAIL?.trim().toLowerCase()

  const active = activeEmail
    ? await sql`
        SELECT c.id, c.email, c.full_name, c.status, tl.id AS link_id, tl.slug, tl.click_count
        FROM creators c
        LEFT JOIN tracking_links tl ON tl.creator_id = c.id AND tl.is_default = TRUE
        WHERE lower(c.email) = ${activeEmail}
        LIMIT 1
      `
    : await sql`
        SELECT c.id, c.email, c.full_name, c.status, tl.id AS link_id, tl.slug, tl.click_count
        FROM creators c
        JOIN tracking_links tl ON tl.creator_id = c.id AND tl.is_default = TRUE AND tl.active = TRUE
        WHERE c.status = 'active' AND c.email IS NOT NULL
        ORDER BY c.created_at DESC
        LIMIT 1
      `

  const pending = pendingEmail
    ? await sql`
        SELECT id, email, full_name, status
        FROM creators
        WHERE lower(email) = ${pendingEmail}
        LIMIT 1
      `
    : await sql`
        SELECT id, email, full_name, status
        FROM creators
        WHERE status = 'pending' AND email IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 1
      `

  const activeCreator = active.rows[0]
  const pendingCreator = pending.rows[0]

  assert(activeCreator, 'No active creator fixture found')
  assert(activeCreator.status === 'active', 'Active fixture is not active')
  assert(activeCreator.slug, 'Active creator fixture has no default tracking slug')
  assert(pendingCreator, 'No pending creator fixture found')
  assert(pendingCreator.status === 'pending', 'Pending fixture is not pending')

  return { activeCreator, pendingCreator }
}

async function requestMagicLink(email) {
  const response = await fetch(`${STAGING_BASE_URL}/api/creators/magic-link`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'codex-staging-creator-validation/1.0',
    },
    body: JSON.stringify({ email }),
  })
  const body = await response.json().catch(() => null)
  assert(response.status === 200, `Magic link request failed for ${maskEmail(email)} with ${response.status}`)
  assert(body?.success === true, `Magic link response was not successful for ${maskEmail(email)}`)
  return body
}

async function findRecentCreatorEmail(email, sinceMs) {
  const list = await resendFetch('/emails?limit=50')
  const candidates = Array.isArray(list?.data) ? list.data : []
  return candidates.find((message) => {
    const createdAt = Date.parse(message.created_at)
    return (
      createdAt >= sinceMs &&
      message.subject === LOGIN_SUBJECT &&
      Array.isArray(message.to) &&
      message.to.map((to) => to.toLowerCase()).includes(email.toLowerCase())
    )
  })
}

async function waitForCreatorEmail(email, sinceMs) {
  const deadline = Date.now() + 90_000
  let lastMatch = null

  while (Date.now() < deadline) {
    lastMatch = await findRecentCreatorEmail(email, sinceMs)
    if (lastMatch && ['delivered', 'opened', 'clicked'].includes(lastMatch.last_event)) {
      return lastMatch
    }
    await new Promise((resolve) => setTimeout(resolve, 5_000))
  }

  if (lastMatch) {
    throw new Error(`Resend email for ${maskEmail(email)} did not reach delivered/opened/clicked; last_event=${lastMatch.last_event}`)
  }
  throw new Error(`No Resend creator login email found for ${maskEmail(email)}`)
}

async function extractVerifyLink(emailId) {
  const message = await resendFetch(`/emails/${emailId}`)
  const html = message?.html || ''
  const match = html.match(/https?:\/\/[^"'<>\s]+\/api\/creators\/verify-login\?token=[^"'<>\s]+/)
  assert(match, 'Could not find verify-login link in pending creator email')
  return match[0].replaceAll('&amp;', '&')
}

async function validatePendingRedirect(pendingEmailId) {
  const verifyLink = await extractVerifyLink(pendingEmailId)
  const response = await fetch(verifyLink, {
    redirect: 'manual',
    headers: { 'user-agent': 'codex-staging-creator-validation/1.0' },
  })
  const location = response.headers.get('location') || ''
  assert([302, 303, 307, 308].includes(response.status), `Pending verify did not redirect; status=${response.status}`)
  assert(location.includes('/creators/pending'), `Pending verify did not land on /creators/pending; location=${location}`)
  assert((response.headers.get('set-cookie') || '').includes('cultr_session_v2='), 'Pending verify did not set creator session cookie')
  return location
}

async function validateTrackingRewrite(activeCreator) {
  const before = await sql`
    SELECT click_count
    FROM tracking_links
    WHERE id = ${activeCreator.link_id}
  `
  const beforeCount = Number(before.rows[0]?.click_count || 0)
  let trackingBase = TRACKING_BASE_URL
  let response
  try {
    response = await fetch(`${trackingBase}/${activeCreator.slug}?codex_validation=${Date.now()}`, {
      redirect: 'manual',
      headers: { 'user-agent': 'codex-staging-creator-validation/1.0' },
    })
  } catch (error) {
    if (TRACKING_BASE_URL === TRACKING_FALLBACK_BASE_URL) throw error
    trackingBase = TRACKING_FALLBACK_BASE_URL
    response = await fetch(`${trackingBase}/${activeCreator.slug}?codex_validation=${Date.now()}`, {
      redirect: 'manual',
      headers: { 'user-agent': 'codex-staging-creator-validation/1.0' },
    })
  }
  assert([302, 303, 307, 308].includes(response.status), `Tracking URL did not redirect; status=${response.status}`)
  assert((response.headers.get('set-cookie') || '').includes('cultr_attribution='), 'Tracking URL did not set attribution cookie')

  const after = await sql`
    SELECT click_count
    FROM tracking_links
    WHERE id = ${activeCreator.link_id}
  `
  const afterCount = Number(after.rows[0]?.click_count || 0)
  assert(afterCount > beforeCount, `Tracking click count did not increment; before=${beforeCount} after=${afterCount}`)
  return { beforeCount, afterCount, location: response.headers.get('location') || '', trackingBase }
}

async function createAdminSessionToken() {
  const secret = requiredEnv('SESSION_SECRET')
  const adminEmail = (process.env.ADMIN_ALLOWED_EMAILS || 'admin@cultrhealth.com').split(',')[0].trim()
  return new SignJWT({
    email: adminEmail,
    customerId: 'staging-admin-validation',
    role: 'admin',
    type: 'session',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(new TextEncoder().encode(secret))
}

async function validateCommissionAudit() {
  const token = await createAdminSessionToken()
  const response = await fetch(`${STAGING_BASE_URL}/api/admin/creators/commission-audit`, {
    headers: {
      cookie: `cultr_session_v2=${token}`,
      authorization: `Bearer ${token}`,
      'user-agent': 'codex-staging-creator-validation/1.0',
    },
  })
  const body = await response.json().catch(() => null)
  assert(response.status === 200, `Commission audit failed with ${response.status}: ${JSON.stringify(body)}`)
  assert(body?.success === true, 'Commission audit did not return success=true')
  assert(body?.readOnly === true, 'Commission audit did not report readOnly=true')
  return body
}

async function main() {
  requiredEnv('POSTGRES_URL')
  requiredEnv('RESEND_API_KEY')

  const reuseRecentEmails = process.env.REUSE_RECENT_EMAILS === '1'
  const startedAt = reuseRecentEmails ? Date.now() - 10 * 60_000 : Date.now() - 2_000
  const { activeCreator, pendingCreator } = await getCreatorFixtures()

  console.log(`Staging base: ${STAGING_BASE_URL}`)
  console.log(`Tracking base: ${TRACKING_BASE_URL}`)
  console.log(`Active creator fixture: ${maskEmail(activeCreator.email)} (${activeCreator.slug})`)
  console.log(`Pending creator fixture: ${maskEmail(pendingCreator.email)}`)

  if (reuseRecentEmails) {
    console.log('Reusing recent Resend creator login emails from the last 10 minutes')
  } else {
    await requestMagicLink(activeCreator.email)
    await requestMagicLink(pendingCreator.email)
  }

  const activeEmail = await waitForCreatorEmail(activeCreator.email, startedAt)
  const pendingEmail = await waitForCreatorEmail(pendingCreator.email, startedAt)
  console.log(`Active login email: ${activeEmail.last_event} (${activeEmail.id})`)
  console.log(`Pending login email: ${pendingEmail.last_event} (${pendingEmail.id})`)

  const pendingLocation = await validatePendingRedirect(pendingEmail.id)
  console.log(`Pending verify redirect: ${pendingLocation}`)

  const tracking = await validateTrackingRewrite(activeCreator)
  console.log(`Tracking click incremented: ${tracking.beforeCount} -> ${tracking.afterCount}`)
  console.log(`Tracking base used: ${tracking.trackingBase}`)
  console.log(`Tracking redirect: ${tracking.location}`)

  const audit = await validateCommissionAudit()
  console.log(`Commission audit: ${audit.totalIssues} issue(s) across ${Object.keys(audit.checks || {}).length} checks`)
}

main().catch((error) => {
  console.error(`Validation failed: ${error.message}`)
  process.exit(1)
})
