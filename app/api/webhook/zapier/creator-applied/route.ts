import { NextRequest, NextResponse } from 'next/server'
import { getCreatorByEmail, createCreator, createTrackingLink, createAffiliateCode, checkAffiliateCodeExists } from '@/lib/creators/db'
import { generateCreatorCodes } from '@/lib/config/affiliate'
import { CREATOR_NOTIFICATION_EMAILS } from '@/lib/config/creator-notification-emails'
import { escapeHtml, baseEmailTemplate } from '@/lib/resend'
import { Resend } from 'resend'

/**
 * Zapier → CULTR inbound webhook: creator applied via external form tool.
 *
 * Zapier calls this when a creator submits via Typeform, Tally, etc.
 * Auth: Authorization: Bearer <ZAPIER_WEBHOOK_SECRET>
 *
 * Body: { name, email, phone?, social_handle?, bio? }
 */

function verifyBearer(request: NextRequest): boolean {
  const secret = process.env.ZAPIER_WEBHOOK_SECRET
  if (!secret) return false
  const auth = request.headers.get('authorization') ?? ''
  return auth === `Bearer ${secret}`
}

export async function POST(request: NextRequest) {
  if (!verifyBearer(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim() : undefined
  const social_handle = typeof body.social_handle === 'string' ? body.social_handle.trim() : undefined
  const bio = typeof body.bio === 'string' ? body.bio.trim() : undefined

  if (!name || !email) {
    return NextResponse.json({ error: 'name and email are required' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  // Idempotent — return existing creator without re-creating
  const existing = await getCreatorByEmail(email)
  if (existing) {
    return NextResponse.json({ created: false, creatorId: existing.id, status: existing.status })
  }

  const creator = await createCreator({ email, full_name: name, phone, social_handle, bio })

  // Generate tracking link + affiliate codes
  let slug = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) + Math.floor(Math.random() * 1000)
  try {
    await createTrackingLink(creator.id, slug, '/', true)
  } catch {
    slug = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) + Math.floor(Math.random() * 100_000)
    await createTrackingLink(creator.id, slug, '/', true)
  }

  let { membershipCode, productCode } = generateCreatorCodes(name)
  let suffix = 1
  while (suffix <= 10 && (await checkAffiliateCodeExists(membershipCode) || await checkAffiliateCodeExists(productCode))) {
    membershipCode = `${membershipCode.replace(/\d+$/, '')}${suffix}`
    productCode = `${productCode.replace(/\d+$/, '')}${suffix}`
    suffix++
  }
  await createAffiliateCode(creator.id, membershipCode, true, 'percentage', 10.00, 'membership')
  await createAffiliateCode(creator.id, productCode, false, 'percentage', 10.00, 'product')

  // Notify owner
  if (process.env.RESEND_API_KEY) {
    try {
      const { getFromEmail } = await import('@/lib/resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: getFromEmail(),
        to: [...CREATOR_NOTIFICATION_EMAILS],
        subject: `🧑‍🎤 New creator via Zapier — ${escapeHtml(name)}`,
        html: baseEmailTemplate(`
          <p>A new creator was added via Zapier (external form).</p>
          <table style="width:100%;font-size:14px;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#546E6B;">Name</td><td>${escapeHtml(name)}</td></tr>
            <tr><td style="padding:8px 0;color:#546E6B;">Email</td><td>${escapeHtml(email)}</td></tr>
            ${social_handle ? `<tr><td style="padding:8px 0;color:#546E6B;">Social</td><td>${escapeHtml(social_handle)}</td></tr>` : ''}
          </table>
        `),
      })
    } catch {
      // Non-fatal
    }
  }

  return NextResponse.json({ created: true, creatorId: creator.id, status: 'pending' })
}
