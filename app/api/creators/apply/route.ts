import { NextRequest, NextResponse } from 'next/server'
import { formLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import { createCreator, getCreatorByEmail, updateCreatorStatus, createTrackingLink, createAffiliateCode } from '@/lib/creators/db'
import { createMagicLinkToken } from '@/lib/auth'

const AUTO_APPROVE_EMAILS = [
  'erik@threepointshospitality.com',
  'stewart@cultrhealth.com',
]

export async function POST(request: NextRequest) {
  try {
    const clientIp = await getClientIp()
    const rateLimitResult = await formLimiter.check(`creator-apply:${clientIp}`)
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult)
    }

    const body = await request.json()
    const { email, full_name, phone, social_handle, bio, recruiter_code } = body

    if (!email || !full_name) {
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Check if creator already exists
    const existing = await getCreatorByEmail(email)
    if (existing) {
      if (existing.status === 'active') {
        return NextResponse.json(
          { error: 'This email is already registered as a creator' },
          { status: 409 }
        )
      }
      if (existing.status === 'pending') {
        return NextResponse.json(
          { error: 'Your application is already pending review' },
          { status: 409 }
        )
      }
    }

    // Resolve recruiter code to recruiter ID (try slug first, fall back to affiliate code)
    let recruiterId: string | undefined
    if (recruiter_code) {
      const { getTrackingLinkBySlug, getAffiliateCodeByCode, getCreatorById } = await import('@/lib/creators/db')
      let resolvedCreatorId: string | undefined
      const link = await getTrackingLinkBySlug(recruiter_code)
      if (link) {
        resolvedCreatorId = link.creator_id
      } else {
        const code = await getAffiliateCodeByCode(recruiter_code)
        if (code) resolvedCreatorId = code.creator_id
      }
      if (resolvedCreatorId) {
        const recruiter = await getCreatorById(resolvedCreatorId)
        if (recruiter?.status === 'active') recruiterId = resolvedCreatorId
      }
    }

    // Create the creator
    const creator = await createCreator({
      email,
      full_name,
      phone,
      social_handle,
      bio,
      recruiter_id: recruiterId,
    })

    // Auto-approve whitelisted emails
    if (AUTO_APPROVE_EMAILS.includes(email.toLowerCase())) {
      await updateCreatorStatus(creator.id, 'active', 'system-auto-approve')

      const defaultSlug = full_name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 20) + Math.floor(Math.random() * 1000)

      await createTrackingLink(creator.id, defaultSlug, '/', true)

      const code = full_name
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .slice(0, 6) + '10'

      await createAffiliateCode(creator.id, code, true)

      const verificationToken = await createMagicLinkToken(email)
      console.log(`Creator auto-approved: ${email}`)

      return NextResponse.json({
        success: true,
        autoApproved: true,
        message: 'You have been approved! Check your email to log in.',
        creatorId: creator.id,
        trackingSlug: defaultSlug,
        couponCode: code,
        ...(process.env.NODE_ENV !== 'production' && { verificationToken }),
      })
    }

    // Generate email verification token
    const verificationToken = await createMagicLinkToken(email)

    // In production, send email with verification link
    // For now, return token for testing
    console.log(`Creator application: ${email}, verification token: ${verificationToken}`)

    return NextResponse.json({
      success: true,
      message: 'Application submitted. Please check your email to verify your address.',
      creatorId: creator.id,
      // Include token in non-production for testing
      ...(process.env.NODE_ENV !== 'production' && { verificationToken }),
    })
  } catch (error) {
    console.error('Creator application error:', error)
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    )
  }
}
