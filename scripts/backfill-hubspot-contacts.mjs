#!/usr/bin/env node

import dotenv from 'dotenv'
import { sql } from '@vercel/postgres'

dotenv.config({ path: '.env.local' })

const VALID_SOURCES = new Set(['club_member', 'waitlist', 'quiz', 'creator', 'membership'])
const SOURCE_PRIORITY = ['club_member', 'creator', 'waitlist', 'quiz', 'membership']
const HUBSPOT_VALID_ORDERS = ['paid', 'waiting_to_ship', 'shipped', 'fulfilled']
const HUBSPOT_PRODUCT_ORDERS = ['paid', 'shipped', 'fulfilled']

const args = process.argv.slice(2)
const HELP = args.includes('--help') || args.includes('-h')
const APPLY = args.includes('--apply')

function printUsage() {
  console.log('')
  console.log('Backfill HubSpot contacts from database records.')
  console.log('')
  console.log('Usage:')
  console.log('  node scripts/backfill-hubspot-contacts.mjs [--apply] [--source=comma-separated] [--since=YYYY-MM-DD] [--limit=N]')
  console.log('')
  console.log('Options:')
  console.log('  --apply           Write updates to HubSpot (default dry-run)')
  console.log('  --source=...      Comma-separated sources to include')
  console.log('                    Allowed: club_member, waitlist, quiz, creator, membership (default: all)')
  console.log('  --since=DATE      Only process records created after this ISO date')
  console.log('  --limit=N         Process only the first N merged contacts')
  console.log('')
}

function parseLimit(value) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid --limit value: ${value}`)
  }
  return Math.floor(parsed)
}

function parseSourceFilter(rawValue) {
  const normalized = new Set()
  const entries = rawValue.split(',').map((value) => value.trim().toLowerCase())

  for (const entry of entries) {
    if (!entry || entry === 'all') continue

    if (entry === 'club') {
      normalized.add('club_member')
      continue
    }
    if (!VALID_SOURCES.has(entry)) {
      throw new Error(`Unknown --source value: ${entry}`)
    }
    normalized.add(entry)
  }

  return normalized
}

function parseSince(rawValue) {
  const parsed = new Date(rawValue)
  if (Number.isNaN(parsed.valueOf())) {
    throw new Error(`Invalid --since value: ${rawValue}`)
  }
  return parsed
}

const sourceArg = args.find((arg) => arg.startsWith('--source='))
const limitArg = args.find((arg) => arg.startsWith('--limit='))
const sinceArg = args.find((arg) => arg.startsWith('--since='))

let limit
let sourceFilter = new Set()
let sinceDate

try {
  if (limitArg) {
    limit = parseLimit(limitArg.split('=')[1])
  }
  if (sourceArg) {
    sourceFilter = parseSourceFilter(sourceArg.split('=')[1] || '')
    if (sourceFilter.size === 0) {
      sourceFilter = new Set(VALID_SOURCES)
    }
  } else {
    sourceFilter = new Set(VALID_SOURCES)
  }
  if (sinceArg) {
    sinceDate = parseSince(sinceArg.split('=')[1])
  }
} catch (error) {
  console.error('')
  console.error(error.message || error)
  printUsage()
  process.exit(1)
}

if (HELP) {
  printUsage()
  process.exit(0)
}

if (!process.env.POSTGRES_URL) {
  console.error('POSTGRES_URL is not configured.')
  process.exit(1)
}

const HUBSPOT_TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN || process.env.HUBSPOT_ACCESS_TOKEN
if (APPLY && !HUBSPOT_TOKEN) {
  console.error('HUBSPOT_PRIVATE_APP_TOKEN or HUBSPOT_ACCESS_TOKEN is required when --apply is set.')
  process.exit(1)
}

function normalizeEmail(value) {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim().toLowerCase()
  return normalized && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : undefined
}

function normalizePhone(value) {
  if (!value || typeof value !== 'string') return undefined
  const digits = value.replace(/\D/g, '')
  return digits.length >= 7 ? value.trim() : undefined
}

function cleanName(value) {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim().replace(/\s+/g, ' ')
  if (!trimmed || trimmed.length < 2) return undefined
  if (/^(test|asdf|unknown|n\/a|na|none|null)$/i.test(trimmed)) return undefined
  return trimmed
}

function parseName(value) {
  const fullName = cleanName(value)
  if (!fullName) return {}

  const parts = fullName.split(' ')
  const firstName = parts[0]
  const lastName = parts.slice(1).join(' ') || undefined
  return { fullName, firstName, lastName }
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function toDateValue(value) {
  if (!value) return undefined
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString()
}

function formatMoney(value) {
  const num = toNumber(value)
  if (num === undefined) return undefined
  return num.toFixed(2)
}

function isAfterSince(sourceDate, cutoff) {
  if (!cutoff) return true
  const parsed = sourceDate ? new Date(sourceDate) : null
  return parsed ? parsed.getTime() >= cutoff.getTime() : false
}

function normalizeSourceName(source) {
  if (source === 'club') return 'club_member'
  return source
}

function addTag(tags, value) {
  if (!value) return
  const normalized = String(value).trim()
  if (!normalized) return
  if (!tags.includes(normalized)) tags.push(normalized)
}

function getFieldPriority(source) {
  return SOURCE_PRIORITY.indexOf(source)
}

function makeCandidate({
  source,
  email,
  phone,
  firstName,
  lastName,
  fullName,
  age,
  gender,
  city,
  state,
  socialHandle,
  signupType,
  tags,
  leadSource,
  formType,
  formName,
  lifecycleEvent,
  updatedAt,
  browser,
  deviceType,
  joinedAt,
  landingPage,
  referrerUrl,
  utmSource,
  utmMedium,
  utmCampaign,
  utmTerm,
  utmContent,
  planTier,
  primaryTherapy,
  note,
  lifecycleStage,
  converted,
  orderCount,
  totalSpent,
}) {
  return {
    source,
    email: normalizeEmail(email),
    phone: normalizePhone(phone),
    firstName,
    lastName,
    fullName,
    age,
    gender: gender === 'male' || gender === 'female' ? gender : undefined,
    city,
    state,
    socialHandle: cleanName(socialHandle),
    signupType: typeof signupType === 'string' ? signupType.trim() : undefined,
    tags: [...(tags || [])],
    leadSource,
    formType,
    formName,
    lifecycleEvent,
    updatedAt,
    browser: cleanName(browser),
    deviceType: cleanName(deviceType),
    joinedAt: toDateValue(joinedAt),
    landingPage: cleanName(landingPage),
    referrerUrl: cleanName(referrerUrl),
    utmSource: cleanName(utmSource),
    utmMedium: cleanName(utmMedium),
    utmCampaign: cleanName(utmCampaign),
    utmTerm: cleanName(utmTerm),
    utmContent: cleanName(utmContent),
    planTier: cleanName(planTier),
    primaryTherapy: cleanName(primaryTherapy),
    note,
    lifecycleStage,
    converted,
    orderCount: toNumber(orderCount),
    totalSpent: toNumber(totalSpent),
    sourcePriority: getFieldPriority(source),
  }
}

function mergeCandidate(contact, candidate) {
  if (!candidate || (!candidate.email && !candidate.phone)) return
  if (!candidate.phone && !candidate.email) return

  if (!contact.tags.includes('backfill')) contact.tags.push('backfill')

  for (const tag of candidate.tags || []) addTag(contact.tags, tag)
  addTag(contact.tags, candidate.source)

  const candidateUpdated = toDateValue(candidate.updatedAt) || new Date().toISOString()

  if (!contact.sources.includes(candidate.source)) contact.sources.push(candidate.source)

  if (candidate.leadSource && contact.fieldSource.leadSource === undefined) {
    contact.fieldSource.leadSource = candidate.sourcePriority
    contact.leadSource = candidate.leadSource
  } else if (
    candidate.leadSource &&
    contact.fieldSource.leadSource > candidate.sourcePriority
  ) {
    contact.fieldSource.leadSource = candidate.sourcePriority
    contact.leadSource = candidate.leadSource
  }

  if (!contact.formType || contact.fieldSource.formType > candidate.sourcePriority) {
    contact.fieldSource.formType = candidate.sourcePriority
    contact.formType = candidate.formType
    contact.formName = candidate.formName
    contact.lifecycleEvent = candidate.lifecycleEvent
  }

  if (!contact.joinedAt || (candidateUpdated && contact.joinedAt > candidateUpdated)) {
    contact.joinedAt = candidateUpdated
  }

  const candidateName = {
    firstName: candidate.firstName || parseName(candidate.fullName || '').firstName,
    lastName: candidate.lastName || parseName(candidate.fullName || '').lastName,
  }

  if (!contact.firstName && candidateName.firstName) {
    contact.firstName = candidateName.firstName
    contact.fieldSource.firstName = candidate.sourcePriority
  }

  if (!contact.lastName && candidateName.lastName) {
    contact.lastName = candidateName.lastName
    contact.fieldSource.lastName = candidate.sourcePriority
  }

  if (!contact.fullName && candidate.fullName) {
    contact.fullName = candidate.fullName
    contact.fieldSource.fullName = candidate.sourcePriority
  }

  if (!contact.email && candidate.email) contact.email = candidate.email
  if (!contact.phone && candidate.phone) contact.phone = candidate.phone

  if (!contact.age && candidate.age !== undefined) contact.age = candidate.age
  if (!contact.gender && candidate.gender) contact.gender = candidate.gender
  if (!contact.city && candidate.city) contact.city = candidate.city
  if (!contact.state && candidate.state) contact.state = candidate.state
  if (!contact.socialHandle && candidate.socialHandle) contact.socialHandle = candidate.socialHandle
  if (!contact.signupType && candidate.signupType) contact.signupType = candidate.signupType

  if (!contact.browser && candidate.browser) contact.browser = candidate.browser
  if (!contact.deviceType && candidate.deviceType) contact.deviceType = candidate.deviceType
  if (!contact.landingPage && candidate.landingPage) contact.landingPage = candidate.landingPage
  if (!contact.referrerUrl && candidate.referrerUrl) contact.referrerUrl = candidate.referrerUrl
  if (!contact.utmSource && candidate.utmSource) contact.utmSource = candidate.utmSource
  if (!contact.utmMedium && candidate.utmMedium) contact.utmMedium = candidate.utmMedium
  if (!contact.utmCampaign && candidate.utmCampaign) contact.utmCampaign = candidate.utmCampaign
  if (!contact.utmTerm && candidate.utmTerm) contact.utmTerm = candidate.utmTerm
  if (!contact.utmContent && candidate.utmContent) contact.utmContent = candidate.utmContent
  if (!contact.planTier && candidate.planTier) contact.planTier = candidate.planTier
  if (!contact.primaryTherapy && candidate.primaryTherapy) contact.primaryTherapy = candidate.primaryTherapy
  if (!contact.note && candidate.note) contact.note = candidate.note

  if (candidate.lifecycleStage && (!contact.lifecycleStage || contact.lifecycleStage !== 'customer')) {
    contact.lifecycleStage = candidate.lifecycleStage
  }

  if (candidate.converted) {
    contact.converted = true
  }

  contact.orderCount += candidate.orderCount || 0
  contact.totalSpent += candidate.totalSpent || 0
}

function buildEmptyContact() {
  return {
    email: undefined,
    phone: undefined,
    firstName: undefined,
    lastName: undefined,
    fullName: undefined,
    age: undefined,
    gender: undefined,
    city: undefined,
    state: undefined,
    socialHandle: undefined,
    signupType: undefined,
    tags: ['backfill'],
    sources: [],
    leadSource: 'CULTR Health',
    formType: undefined,
    formName: undefined,
    lifecycleEvent: 'backfill',
    lifecycleStage: undefined,
    joinedAt: undefined,
    browser: undefined,
    deviceType: undefined,
    landingPage: undefined,
    referrerUrl: undefined,
    utmSource: undefined,
    utmMedium: undefined,
    utmCampaign: undefined,
    utmTerm: undefined,
    utmContent: undefined,
    planTier: undefined,
    primaryTherapy: undefined,
    note: undefined,
    converted: false,
    orderCount: 0,
    totalSpent: 0,
    avgOrderValue: undefined,
    lastOrderDate: undefined,
    lastOrderNumber: undefined,
    fieldSource: {
      leadSource: undefined,
      formType: undefined,
      firstName: undefined,
      lastName: undefined,
      fullName: undefined,
    },
  }
}

async function loadSourceRows() {
  const rowsBySource = {}

  rowsBySource.club_member = (await sql`
    SELECT
      id,
      name,
      email,
      phone,
      social_handle,
      age,
      gender,
      address_city,
      address_state,
      source,
      signup_type,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
      referrer_url,
      landing_page,
      browser,
      device_type,
      first_visit_at,
      created_at,
      updated_at
    FROM club_members
    ORDER BY COALESCE(updated_at, created_at) DESC
  `).rows

  rowsBySource.waitlist = (await sql`
    SELECT
      id,
      name,
      email,
      phone,
      social_handle,
      source,
      treatment_reason,
      coupon_code,
      created_at,
      updated_at
    FROM waitlist
    ORDER BY updated_at DESC
  `).rows

  rowsBySource.quiz = (await sql`
    SELECT
      id,
      session_id,
      lead_first_name,
      lead_last_name,
      lead_email,
      lead_phone,
      lead_captured_at,
      recommended_tier,
      recommended_therapy,
      answers,
      clicked_join,
      completed_at
    FROM quiz_responses
    WHERE lead_email IS NOT NULL
    ORDER BY COALESCE(lead_captured_at, completed_at) DESC
  `).rows

  rowsBySource.creator = (await sql`SELECT * FROM creators ORDER BY COALESCE(updated_at, created_at) DESC`).rows

  rowsBySource.membership = (await sql`SELECT * FROM memberships WHERE email IS NOT NULL ORDER BY COALESCE(updated_at, created_at) DESC`).rows

  return rowsBySource
}

async function loadOrderStats() {
  const clubRowStats = (await sql`
    SELECT
      LOWER(cm.email) AS email,
      COUNT(co.id)::int AS total_order_count,
      COUNT(co.id) FILTER (WHERE co.status IN ('paid', 'waiting_to_ship', 'shipped', 'fulfilled'))::int AS valid_order_count,
      COALESCE(SUM(
        CASE
          WHEN co.status IN ('paid', 'waiting_to_ship', 'shipped', 'fulfilled')
            THEN COALESCE(co.subtotal_usd, 0)
          ELSE 0
        END
      ), 0)::float8 AS valid_order_spent,
      MAX(co.created_at) FILTER (WHERE co.status IN ('paid', 'waiting_to_ship', 'shipped', 'fulfilled')) AS last_order_date
    FROM club_orders co
    INNER JOIN club_members cm ON cm.id = co.member_id
    GROUP BY LOWER(cm.email)
  `).rows

  const clubLastOrderRows = (await sql`
    SELECT DISTINCT ON (LOWER(cm.email))
      LOWER(cm.email) AS email,
      co.order_number,
      co.created_at
    FROM club_orders co
    INNER JOIN club_members cm ON cm.id = co.member_id
    WHERE co.status IN ('paid', 'waiting_to_ship', 'shipped', 'fulfilled')
    ORDER BY LOWER(cm.email), co.created_at DESC
  `).rows

  const productRows = (await sql`
    SELECT
      LOWER(customer_email) AS email,
      COUNT(*)::int AS total_order_count,
      COUNT(*) FILTER (WHERE status IN ('paid', 'shipped', 'fulfilled'))::int AS valid_order_count,
      COALESCE(SUM(
        CASE
          WHEN status IN ('paid', 'shipped', 'fulfilled')
            THEN GREATEST(COALESCE(total_amount, 0) - COALESCE(refunded_amount, 0), 0)
          ELSE 0
        END
      ), 0)::float8 AS valid_order_spent,
      MAX(created_at) FILTER (WHERE status IN ('paid', 'shipped', 'fulfilled')) AS last_order_date
    FROM orders
    WHERE customer_email IS NOT NULL
    GROUP BY LOWER(customer_email)
  `).rows

  const productLastOrderRows = (await sql`
    SELECT DISTINCT ON (LOWER(customer_email))
      LOWER(customer_email) AS email,
      order_number,
      created_at
    FROM orders
    WHERE customer_email IS NOT NULL
      AND status IN ('paid', 'shipped', 'fulfilled')
    ORDER BY LOWER(customer_email), created_at DESC
  `).rows

  const activeMemberships = new Set()
  const membershipPlanByEmail = new Map()
  const membershipRows = (await sql`
    SELECT LOWER(email) AS email, plan_tier, subscription_status
    FROM memberships
    WHERE email IS NOT NULL
  `).rows

  for (const row of membershipRows) {
    const email = row.email
    if (!email) continue
    if (['active', 'past_due', 'trialing'].includes(String(row.subscription_status || '').toLowerCase())) {
      activeMemberships.add(email)
    }
    if (row.plan_tier && !membershipPlanByEmail.has(email)) {
      membershipPlanByEmail.set(email, String(row.plan_tier))
    }
  }

  const clubByEmail = new Map()
  const clubLastByEmail = new Map()
  const productByEmail = new Map()
  const productLastByEmail = new Map()

  for (const row of clubRowStats) {
    if (!row.email) continue
    clubByEmail.set(String(row.email), {
      total_order_count: Number(row.total_order_count || 0),
      valid_order_count: Number(row.valid_order_count || 0),
      valid_order_spent: Number(row.valid_order_spent || 0),
      last_order_date: toDateValue(row.last_order_date),
    })
  }

  for (const row of clubLastOrderRows) {
    if (!row.email) continue
    clubLastByEmail.set(String(row.email), {
      last_order_number: row.order_number ? String(row.order_number) : undefined,
      last_order_date: toDateValue(row.created_at),
    })
  }

  for (const row of productRows) {
    if (!row.email) continue
    productByEmail.set(String(row.email), {
      total_order_count: Number(row.total_order_count || 0),
      valid_order_count: Number(row.valid_order_count || 0),
      valid_order_spent: Number(row.valid_order_spent || 0),
      last_order_date: toDateValue(row.last_order_date),
    })
  }

  for (const row of productLastOrderRows) {
    if (!row.email) continue
    productLastByEmail.set(String(row.email), {
      last_order_number: row.order_number ? String(row.order_number) : undefined,
      last_order_date: toDateValue(row.created_at),
    })
  }

  return {
    clubByEmail,
    clubLastByEmail,
    productByEmail,
    productLastByEmail,
    activeMemberships,
    membershipPlanByEmail,
  }
}

function buildContactKey(email, phone) {
  if (email) return `email:${email}`
  if (phone) return `phone:${phone}`
  return null
}

function addClubMemberCandidates(rawRows, buckets) {
  let count = 0
  for (const row of rawRows) {
    const email = normalizeEmail(row.email)
    if (!email) continue
    if (!isAfterSince(row.created_at || row.updated_at, sinceDate)) continue

    const nameParts = parseName(row.name)
    const candidate = makeCandidate({
      source: 'club_member',
      email,
      phone: row.phone,
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      fullName: nameParts.fullName,
      age: toNumber(row.age),
      gender: row.gender,
      city: row.address_city,
      state: row.address_state,
      socialHandle: row.social_handle,
      signupType: row.signup_type || row.source || undefined,
      tags: ['club_member', row.source ? `source:${row.source}` : 'source:join'],
      leadSource: 'CULTR Club',
      formType: 'club_signup',
      formName: 'CULTR Club signup',
      lifecycleEvent: 'club_signup',
      updatedAt: row.updated_at || row.created_at,
      browser: row.browser,
      deviceType: row.device_type,
      joinedAt: row.first_visit_at || row.created_at,
      landingPage: row.landing_page,
      referrerUrl: row.referrer_url,
      utmSource: row.utm_source,
      utmMedium: row.utm_medium,
      utmCampaign: row.utm_campaign,
      utmTerm: row.utm_term,
      utmContent: row.utm_content,
      note: [
        'CULTR Club member sync candidate',
        `email: ${row.email}`,
        row.source ? `source: ${row.source}` : undefined,
        row.signup_type ? `signup type: ${row.signup_type}` : undefined,
      ].filter(Boolean).join('\n'),
    })
    const key = buildContactKey(candidate.email, candidate.phone)
    if (!key) continue
    const bucket = buckets.get(key) || { candidates: [] }
    bucket.candidates.push(candidate)
    buckets.set(key, bucket)
    count += 1
  }

  return count
}

function addWaitlistCandidates(rawRows, buckets) {
  let count = 0
  for (const row of rawRows) {
    const email = normalizeEmail(row.email)
    if (!email) continue
    if (!isAfterSince(row.updated_at || row.created_at, sinceDate)) continue

    const source = typeof row.source === 'string' ? row.source.toLowerCase() : 'waitlist'
    const nameParts = parseName(row.name)
    const formType = source === 'newsletter' ? 'newsletter' : 'waitlist'
    const candidate = makeCandidate({
      source: 'waitlist',
      email,
      phone: row.phone,
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      fullName: nameParts.fullName,
      socialHandle: row.social_handle,
      tags: ['waitlist', `waitlist:${formType}`],
      leadSource: 'CULTR Health',
      formType,
      formName: formType === 'newsletter' ? 'CULTR Health newsletter' : 'CULTR Health waitlist',
      lifecycleEvent: formType === 'newsletter' ? 'newsletter_signup' : 'waitlist_signup',
      updatedAt: row.updated_at || row.created_at,
      planTier: row.treatment_reason || row.coupon_code || undefined,
      note: [
        'CULTR Waitlist signup',
        `email: ${row.email}`,
        source ? `source: ${source}` : undefined,
        row.treatment_reason ? `interest: ${row.treatment_reason}` : undefined,
        row.coupon_code ? `coupon: ${row.coupon_code}` : undefined,
      ].filter(Boolean).join('\n'),
    })

    const key = buildContactKey(candidate.email, candidate.phone)
    if (!key) continue
    const bucket = buckets.get(key) || { candidates: [] }
    bucket.candidates.push(candidate)
    buckets.set(key, bucket)
    count += 1
  }

  return count
}

function addQuizCandidates(rawRows, buckets) {
  let count = 0
  for (const row of rawRows) {
    const email = normalizeEmail(row.lead_email)
    if (!email) continue
    const rowDate = row.lead_captured_at || row.completed_at
    if (!isAfterSince(rowDate, sinceDate)) continue

    const firstName = cleanName(row.lead_first_name)
    const lastName = cleanName(row.lead_last_name)

    const candidate = makeCandidate({
      source: 'quiz',
      email,
      phone: row.lead_phone,
      firstName,
      lastName,
      tags: ['quiz', row.recommended_tier ? `quiz:${row.recommended_tier}` : 'quiz'],
      leadSource: 'CULTR Health',
      formType: 'quiz',
      formName: 'CULTR Health quiz lead capture',
      lifecycleEvent: 'quiz_lead_captured',
      updatedAt: rowDate,
      planTier: row.recommended_tier,
      primaryTherapy: row.recommended_therapy,
      note: [
        'CULTR Quiz lead capture',
        `session: ${row.session_id}`,
        row.recommended_tier ? `recommended_tier: ${row.recommended_tier}` : undefined,
        row.recommended_therapy ? `recommended_therapy: ${row.recommended_therapy}` : undefined,
        row.clicked_join ? 'clicked_join: true' : undefined,
        'lead_email:' + email,
      ].filter(Boolean).join('\n'),
    })

    const key = buildContactKey(candidate.email, candidate.phone)
    if (!key) continue
    const bucket = buckets.get(key) || { candidates: [] }
    bucket.candidates.push(candidate)
    buckets.set(key, bucket)
    count += 1
  }

  return count
}

function addCreatorCandidates(rawRows, buckets) {
  let count = 0
  for (const row of rawRows) {
    const email = normalizeEmail(row.email)
    if (!email) continue
    if (!isAfterSince(row.updated_at || row.created_at, sinceDate)) continue

    const name = cleanName(row.full_name)
    const nameParts = parseName(name)

    const candidate = makeCandidate({
      source: 'creator',
      email,
      phone: row.phone,
      firstName: nameParts.firstName || name,
      lastName: nameParts.lastName,
      fullName: name,
      age: toNumber(row.age),
      gender: row.gender,
      city: row.address_city,
      state: row.address_state,
      socialHandle: row.social_handle,
      tags: ['creator', row.status ? `creator:${row.status}` : 'creator:application'],
      leadSource: 'CULTR Health',
      formType: 'creator_application',
      formName: 'CULTR Health creator application',
      lifecycleEvent: 'creator_application_submitted',
      updatedAt: row.updated_at || row.created_at,
      note: [
        'CULTR Creator application',
        `email: ${email}`,
        row.status ? `status: ${row.status}` : undefined,
        row.full_name ? `full_name: ${row.full_name}` : undefined,
      ].filter(Boolean).join('\n'),
    })
    const key = buildContactKey(candidate.email, candidate.phone)
    if (!key) continue
    const bucket = buckets.get(key) || { candidates: [] }
    bucket.candidates.push(candidate)
    buckets.set(key, bucket)
    count += 1
  }

  return count
}

function addMembershipCandidates(rawRows, buckets) {
  let count = 0
  for (const row of rawRows) {
    const email = normalizeEmail(row.email)
    if (!email) continue
    if (!isAfterSince(row.updated_at || row.created_at, sinceDate)) continue

    const firstName = cleanName(row.first_name)
    const lastName = cleanName(row.last_name)

    const candidate = makeCandidate({
      source: 'membership',
      email,
      phone: row.phone,
      firstName,
      lastName,
      fullName: [firstName, lastName].filter(Boolean).join(' ') || undefined,
      tags: ['membership_checkout', `membership:${row.subscription_status || 'active'}`],
      leadSource: 'CULTR Health',
      formType: 'membership_checkout',
      formName: 'CULTR Health membership checkout',
      lifecycleEvent: 'membership_checkout_completed',
      lifecycleStage: 'customer',
      updatedAt: row.updated_at || row.created_at,
      converted: ['active', 'past_due', 'trialing'].includes(String(row.subscription_status || '').toLowerCase()),
      note: [
        'CULTR Membership profile',
        `email: ${email}`,
        `plan_tier: ${row.plan_tier || 'unknown'}`,
        `subscription_status: ${row.subscription_status || 'unknown'}`,
      ].filter(Boolean).join('\n'),
    })

    const key = buildContactKey(candidate.email, candidate.phone)
    if (!key) continue
    const bucket = buckets.get(key) || { candidates: [] }
    bucket.candidates.push(candidate)
    buckets.set(key, bucket)
    count += 1
  }

  return count
}

function dedupeCandidatesBySource(rows) {
  const deduped = new Map()
  for (const candidate of rows) {
    const key = buildContactKey(candidate.email, candidate.phone)
    if (!key) continue
    const existing = deduped.get(key)
    if (!existing) {
      deduped.set(key, candidate)
      continue
    }
    const existingAt = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0
    const currentAt = candidate.updatedAt ? new Date(candidate.updatedAt).getTime() : 0
    if (currentAt > existingAt) {
      deduped.set(key, candidate)
    }
  }
  return Array.from(deduped.values())
}

async function collectCandidates() {
  const sourceRows = await loadSourceRows()

  const candidateBuckets = new Map()

  let sourceCounts = {
    club_member: 0,
    waitlist: 0,
    quiz: 0,
    creator: 0,
    membership: 0,
  }

  if (sourceFilter.has('club_member')) {
    sourceCounts.club_member = addClubMemberCandidates(dedupeCandidatesBySource(sourceRows.club_member).map((candidate) => candidate), candidateBuckets)
  }

  if (sourceFilter.has('waitlist')) {
    sourceCounts.waitlist = addWaitlistCandidates(sourceRows.waitlist, candidateBuckets)
  }

  if (sourceFilter.has('quiz')) {
    sourceCounts.quiz = addQuizCandidates(sourceRows.quiz, candidateBuckets)
  }

  if (sourceFilter.has('creator')) {
    sourceCounts.creator = addCreatorCandidates(sourceRows.creator, candidateBuckets)
  }

  if (sourceFilter.has('membership')) {
    sourceCounts.membership = addMembershipCandidates(sourceRows.membership, candidateBuckets)
  }

  const orderStats = await loadOrderStats()

  const mergedContacts = []
  for (const [key, bucket] of candidateBuckets.entries()) {
    const candidates = bucket.candidates
      .filter((candidate) => sourceFilter.has(candidate.source))
      .sort((a, b) => {
        const sourceDelta = a.sourcePriority - b.sourcePriority
        if (sourceDelta !== 0) return sourceDelta
        const aDate = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
        const bDate = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
        return bDate - aDate
      })

    const keyEmail = key.startsWith('email:') ? key.slice(6) : undefined
    const keyPhone = key.startsWith('phone:') ? key.slice(6) : undefined

    if (candidates.length === 0) continue

    const contact = buildEmptyContact()
    if (keyEmail) contact.email = keyEmail
    if (keyPhone) contact.phone = keyPhone

    for (const candidate of candidates) {
      mergeCandidate(contact, candidate)
    }

    if (!contact.email && !contact.phone) continue
    const normalizedEmail = contact.email || undefined

    const clubStats = normalizedEmail ? orderStats.clubByEmail.get(normalizedEmail) : undefined
    const clubLast = normalizedEmail ? orderStats.clubLastByEmail.get(normalizedEmail) : undefined
    const productStats = normalizedEmail ? orderStats.productByEmail.get(normalizedEmail) : undefined
    const productLast = normalizedEmail ? orderStats.productLastByEmail.get(normalizedEmail) : undefined

    const totalOrderCount = (clubStats?.valid_order_count || 0) + (productStats?.valid_order_count || 0)
    const totalSpent = (clubStats?.valid_order_spent || 0) + (productStats?.valid_order_spent || 0)
    const activeMembership = normalizedEmail ? orderStats.activeMemberships.has(normalizedEmail) : false
    const membershipPlan = normalizedEmail ? orderStats.membershipPlanByEmail.get(normalizedEmail) : undefined

    if (!contact.planTier && membershipPlan) {
      contact.planTier = membershipPlan
    }

    contact.orderCount = totalOrderCount
    contact.totalSpent = totalSpent
    contact.converted = activeMembership || totalOrderCount > 0

    if (contact.converted && contact.totalSpent && totalOrderCount > 0) {
      contact.avgOrderValue = Number((totalSpent / totalOrderCount).toFixed(2))
    } else {
      contact.avgOrderValue = undefined
    }

    const recentOrder = {
      club: clubLast || null,
      product: productLast || null,
    }
    const clubDate = recentOrder.club?.last_order_date ? new Date(recentOrder.club.last_order_date).getTime() : null
    const productDate = recentOrder.product?.last_order_date ? new Date(recentOrder.product.last_order_date).getTime() : null
    if (clubDate || productDate) {
      if (productDate && (!clubDate || productDate > clubDate)) {
        contact.lastOrderDate = recentOrder.product.last_order_date
        contact.lastOrderNumber = recentOrder.product.last_order_number
      } else {
        contact.lastOrderDate = recentOrder.club.last_order_date
        contact.lastOrderNumber = recentOrder.club.last_order_number
      }
    }

    contact.note = [
      contact.note || 'CULTR HubSpot backfill',
      `Sources: ${contact.sources.join(', ') || 'unknown'}`,
      `Converted: ${contact.converted ? 'Yes' : 'No'}`,
      `Order count: ${contact.orderCount}`,
      `Total spent: $${formatMoney(contact.totalSpent) || '0.00'}`,
      contact.lastOrderNumber ? `Last order: ${contact.lastOrderNumber}` : undefined,
      contact.lastOrderDate ? `Last order date: ${contact.lastOrderDate}` : undefined,
      activeMembership ? `Membership status: active` : undefined,
    ].filter(Boolean).join('\n')

    if (isAfterSince(contact.joinedAt, sinceDate)) {
      mergedContacts.push(contact)
    }
  }

  const filtered = mergedContacts
  const sorted = filtered.sort((a, b) => {
    const aTime = a.joinedAt ? new Date(a.joinedAt).getTime() : 0
    const bTime = b.joinedAt ? new Date(b.joinedAt).getTime() : 0
    return bTime - aTime
  })

  return {
    contacts: typeof limit === 'number' ? sorted.slice(0, limit) : sorted,
    sourceCounts,
  }
}

function cleanText(value) {
  if (value === null || value === undefined) return undefined
  const text = String(value).trim()
  return text || undefined
}

function cleanProperties(properties) {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => typeof value === 'string' && value.trim() !== '')
  )
}

function buildHubSpotProperties(contact, includeCustomProperties) {
  const cleanNumber = (value) => {
    if (value === null || value === undefined || value === '') return undefined
    const num = Number(value)
    return Number.isFinite(num) ? String(num) : undefined
  }

  const lifecycleStage = contact.lifecycleStage || (contact.converted ? 'customer' : 'lead')
  return cleanProperties({
    email: contact.email,
    firstname: cleanText(contact.firstName),
    lastname: cleanText(contact.lastName),
    phone: cleanText(contact.phone),
    city: contact.city,
    state: contact.state,
    lifecyclestage: includeCustomProperties ? lifecycleStage : lifecycleStage,
    lead_source: 'Website',
    lead_source_detail: contact.leadSource || 'CULTR Health',
    converted: typeof contact.converted === 'boolean' ? String(contact.converted) : undefined,
    ...(includeCustomProperties
      ? {
          cultr_lead_source: cleanText(contact.leadSource),
          cultr_form_type: cleanText(contact.formType),
          cultr_last_form: cleanText(contact.formName),
          cultr_last_conversion_event: cleanText(contact.lifecycleEvent),
          cultr_signup_type: cleanText(contact.signupType),
          cultr_converted: typeof contact.converted === 'boolean' ? (contact.converted ? 'Yes' : 'No') : undefined,
          cultr_order_count: cleanNumber(contact.orderCount),
          cultr_total_spent: cleanNumber(contact.totalSpent),
          cultr_avg_order_value: cleanNumber(contact.avgOrderValue),
          cultr_age: cleanNumber(contact.age),
          cultr_gender: cleanText(contact.gender),
          cultr_city: cleanText(contact.city),
          cultr_state: cleanText(contact.state),
          cultr_browser: cleanText(contact.browser),
          cultr_device_type: cleanText(contact.deviceType),
          cultr_joined_at: cleanText(contact.joinedAt),
          cultr_landing_page: cleanText(contact.landingPage),
          cultr_referrer_url: cleanText(contact.referrerUrl),
          cultr_hubspotutk: cleanText(contact.hubspotTrackingToken),
          cultr_utm_source: cleanText(contact.utmSource),
          cultr_utm_medium: cleanText(contact.utmMedium),
          cultr_utm_campaign: cleanText(contact.utmCampaign),
          cultr_utm_term: cleanText(contact.utmTerm),
          cultr_utm_content: cleanText(contact.utmContent),
          cultr_tags: (contact.tags || []).join(','),
          cultr_last_event: contact.lifecycleEvent || (contact.tags || []).at(-1),
          social_handle: cleanText(contact.socialHandle),
          cultr_plan_tier: cleanText(contact.planTier),
          cultr_primary_therapy: cleanText(contact.primaryTherapy),
          cultr_last_order_number: cleanText(contact.lastOrderNumber),
          cultr_last_order_date: cleanText(contact.lastOrderDate),
        }
      : {}),
  })
}

async function hubspotFetch(path, init = {}) {
  return fetch(`https://api.hubapi.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${HUBSPOT_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
}

async function findContactId(email, phone) {
  const filters = []
  if (email) filters.push({ propertyName: 'email', operator: 'EQ', value: email })
  if (!filters.length && phone) filters.push({ propertyName: 'phone', operator: 'EQ', value: phone })
  if (!filters.length) return null

  const response = await hubspotFetch('/crm/v3/objects/contacts/search', {
    method: 'POST',
    body: JSON.stringify({
      filterGroups: [{ filters }],
      properties: ['email', 'phone'],
      limit: 1,
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    console.error('[hubspot] Contact search failed:', text)
    return null
  }

  const payload = await response.json()
  return payload?.results?.[0]?.id || null
}

async function createOrUpdateContact(contact) {
  let response = await hubspotFetch('/crm/v3/objects/contacts', {
    method: 'POST',
    body: JSON.stringify({ properties: buildHubSpotProperties(contact, true) }),
  })

  if (!response.ok) {
    const fallbackProperties = buildHubSpotProperties(contact, false)
    const existingId = await findContactId(contact.email, contact.phone)

    if (existingId) {
      response = await hubspotFetch(`/crm/v3/objects/contacts/${existingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ properties: fallbackProperties }),
      })
    } else {
      const fallback = await hubspotFetch('/crm/v3/objects/contacts', {
        method: 'POST',
        body: JSON.stringify({ properties: fallbackProperties }),
      })
      if (fallback.ok) {
        const fallbackBody = await fallback.json().catch(() => null)
        return fallbackBody?.id || null
      }
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(`failed to upsert contact: ${response.status} ${errorText}`)
    }
  }

  if (response.status === 201) {
    const body = await response.json().catch(() => null)
    return body?.id || null
  }

  if (response.status === 200) {
    const id = (await response.json().catch(() => null))?.id
    return id || null
  }

  return null
}

async function getNoteToContactAssociationTypeId() {
  const response = await hubspotFetch('/crm/v4/associations/notes/contacts/labels', { method: 'GET' })
  if (!response.ok) {
    const responseText = await response.text().catch(() => '')
    console.error('[hubspot] Note association labels failed:', responseText)
    return 202
  }

  const payload = await response.json()
  return payload?.results?.find((result) => result?.category === 'HUBSPOT_DEFINED')?.typeId ?? 202
}

async function addContactNote(contactId, note) {
  if (!contactId || !note) return
  const associationTypeId = await getNoteToContactAssociationTypeId()
  const response = await hubspotFetch('/crm/v3/objects/notes', {
    method: 'POST',
    body: JSON.stringify({
      properties: {
        hs_timestamp: new Date().toISOString(),
        hs_note_body: note,
      },
      associations: [
        {
          to: { id: contactId },
          types: [
            {
              associationCategory: 'HUBSPOT_DEFINED',
              associationTypeId,
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.text().catch(() => '')
    console.error('[hubspot] note failed:', error)
  }
}

async function syncContact(contact) {
  if (!contact.email && !contact.phone) return { ok: false, reason: 'missing email and phone' }

  if (!cleanName(contact.firstName || contact.lastName || contact.fullName)) {
    return { ok: false, reason: 'missing valid name' }
  }

  try {
    const id = await createOrUpdateContact(contact)
    if (!id) {
      return { ok: false, reason: 'no hubspot contact id returned' }
    }
    await addContactNote(id, contact.note)
    return { ok: true }
  } catch (error) {
    return { ok: false, reason: error?.message || String(error) }
  }
}

async function main() {
  console.log('')
  console.log('CULTR HubSpot contact backfill')
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`)
  console.log(`Sources: ${Array.from(sourceFilter).join(', ') || 'none'}`)
  console.log(`Since: ${sinceDate ? sinceDate.toISOString() : 'all time'}`)
  console.log(`Limit: ${limit ? String(limit) : 'none'}`)

  const { contacts, sourceCounts } = await collectCandidates()

  console.log('')
  console.log('Source rows pulled:')
  for (const source of SOURCE_PRIORITY) {
    if (!sourceFilter.has(source)) continue
    console.log(`  - ${source}: ${sourceCounts[source]}`)
  }
  console.log(`Total merged contacts: ${contacts.length}`)

  const preview = contacts.slice(0, 5)
  console.log('')
  console.log('Sample merged rows:')
  for (const contact of preview) {
    console.log(`- ${contact.email || `phone:${contact.phone}`}`)
    console.log(
      `  name: ${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.fullName || '—',
      `| sources: ${contact.sources.join(', ') || '—'}`,
      `| converted: ${contact.converted ? 'yes' : 'no'}`,
      `| orders: ${contact.orderCount} / $${formatMoney(contact.totalSpent)}`
    )
    if (contact.joinedAt) {
      console.log(`  joined: ${contact.joinedAt}`)
    }
  }

  if (!APPLY) {
    console.log('')
    console.log('Dry-run complete. Re-run with --apply to write updates to HubSpot.')
    return
  }

  let success = 0
  let skipped = 0
  let failed = 0

  for (const [index, contact] of contacts.entries()) {
    const progress = `${index + 1}/${contacts.length}`
    const result = await syncContact(contact)
    if (result.ok) {
      success += 1
      console.log(`[${progress}] ✅ ${contact.email || `phone:${contact.phone}`}`)
    } else if (result.reason === 'missing valid name' || result.reason === 'missing email and phone') {
      skipped += 1
      console.log(`[${progress}] ⏭️  ${contact.email || `phone:${contact.phone}`} (${result.reason})`)
    } else {
      failed += 1
      console.log(`[${progress}] ❌ ${contact.email || `phone:${contact.phone}`} (${result.reason})`)
    }
  }

  console.log('')
  console.log('Backfill complete.')
  console.log(`  success: ${success}`)
  console.log(`  skipped: ${skipped}`)
  console.log(`  failed: ${failed}`)

  if (failed > 0) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('')
  console.error('Backfill failed:', error?.message || error)
  process.exit(1)
})
