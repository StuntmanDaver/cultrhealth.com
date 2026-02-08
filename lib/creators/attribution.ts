import { createHash, randomBytes } from 'crypto'
import { COMMISSION_CONFIG } from '@/lib/config/affiliate'
import {
  getTrackingLinkBySlug,
  incrementLinkClickCount,
  createClickEvent,
  getClickEventByToken,
  markClickConverted,
  getAffiliateCodeByCode,
  getCreatorById,
} from '@/lib/creators/db'

// ===========================================
// TOKEN GENERATION
// ===========================================

export function generateAttributionToken(): string {
  return randomBytes(24).toString('base64url')
}

export function generateSessionId(): string {
  return randomBytes(16).toString('base64url')
}

export function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 16)
}

// ===========================================
// COOKIE HELPERS
// ===========================================

export interface AttributionCookieData {
  token: string
  creatorId: string
  linkId?: string
  expiresAt: number // Unix timestamp ms
}

export function serializeAttributionCookie(data: AttributionCookieData): string {
  return Buffer.from(JSON.stringify(data)).toString('base64url')
}

export function parseAttributionCookie(value: string): AttributionCookieData | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString())
    if (!parsed.token || !parsed.creatorId || !parsed.expiresAt) return null
    if (parsed.expiresAt < Date.now()) return null
    return parsed as AttributionCookieData
  } catch {
    return null
  }
}

export function getAttributionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: Math.floor(COMMISSION_CONFIG.attributionWindowMs / 1000),
    path: '/',
  }
}

// ===========================================
// CLICK TRACKING
// ===========================================

export async function handleClickTracking(params: {
  slug: string
  ip: string
  userAgent: string
  referer?: string
  existingSessionId?: string
}): Promise<{
  success: boolean
  destinationPath: string
  cookieData?: AttributionCookieData
  sessionId: string
}> {
  // 1. Look up the tracking link by slug
  const link = await getTrackingLinkBySlug(params.slug)
  if (!link) {
    return { success: false, destinationPath: '/', sessionId: '' }
  }

  // 2. Get the creator
  const creator = await getCreatorById(link.creator_id)
  if (!creator || creator.status !== 'active') {
    return { success: false, destinationPath: '/', sessionId: '' }
  }

  // 3. Generate session and attribution tokens
  const sessionId = params.existingSessionId || generateSessionId()
  const attributionToken = generateAttributionToken()
  const ipHash = hashIp(params.ip)

  // 4. Create click event record
  await createClickEvent({
    creator_id: creator.id,
    link_id: link.id,
    session_id: sessionId,
    attribution_token: attributionToken,
    ip_hash: ipHash,
    user_agent: params.userAgent,
    referer: params.referer,
  })

  // 5. Increment link click count
  await incrementLinkClickCount(link.id)

  // 6. Prepare cookie data
  const cookieData: AttributionCookieData = {
    token: attributionToken,
    creatorId: creator.id,
    linkId: link.id,
    expiresAt: Date.now() + COMMISSION_CONFIG.attributionWindowMs,
  }

  // Build destination path with UTM params
  const destinationUrl = new URL(link.destination_path, 'https://cultrhealth.com')
  destinationUrl.searchParams.set('utm_source', link.utm_source || 'creator')
  destinationUrl.searchParams.set('utm_medium', link.utm_medium || 'referral')
  if (link.utm_campaign) {
    destinationUrl.searchParams.set('utm_campaign', link.utm_campaign)
  }

  return {
    success: true,
    destinationPath: destinationUrl.pathname + destinationUrl.search,
    cookieData,
    sessionId,
  }
}

// ===========================================
// CHECKOUT ATTRIBUTION RESOLUTION
// ===========================================

export interface ResolvedAttribution {
  creatorId: string
  method: 'link_click' | 'coupon_code'
  linkId?: string
  codeId?: string
  clickEventId?: string
  isSelfReferral: boolean
}

export async function resolveAttribution(params: {
  customerEmail: string
  attributionCookie?: string
  couponCode?: string
}): Promise<ResolvedAttribution | null> {
  // Priority 1: Coupon code attribution
  if (params.couponCode) {
    const code = await getAffiliateCodeByCode(params.couponCode)
    if (code) {
      const creator = await getCreatorById(code.creator_id)
      if (creator && creator.status === 'active') {
        const isSelfReferral = creator.email.toLowerCase() === params.customerEmail.toLowerCase()
        return {
          creatorId: creator.id,
          method: 'coupon_code',
          codeId: code.id,
          isSelfReferral,
        }
      }
    }
  }

  // Priority 2: Link click attribution (cookie)
  if (params.attributionCookie) {
    const cookieData = parseAttributionCookie(params.attributionCookie)
    if (cookieData) {
      const clickEvent = await getClickEventByToken(cookieData.token)
      if (clickEvent) {
        const creator = await getCreatorById(clickEvent.creator_id)
        if (creator && creator.status === 'active') {
          const isSelfReferral = creator.email.toLowerCase() === params.customerEmail.toLowerCase()
          return {
            creatorId: creator.id,
            method: 'link_click',
            linkId: clickEvent.link_id || undefined,
            clickEventId: clickEvent.id,
            isSelfReferral,
          }
        }
      }
    }
  }

  return null
}

// ===========================================
// PII REDACTION
// ===========================================

export function redactEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return '***@***'
  const visible = local.slice(0, 1)
  return `${visible}***@${domain}`
}
