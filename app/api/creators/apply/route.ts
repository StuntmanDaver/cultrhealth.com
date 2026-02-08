import { NextRequest, NextResponse } from 'next/server'
import { formLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import { createCreator, getCreatorByEmail } from '@/lib/creators/db'
import { createMagicLinkToken } from '@/lib/auth'

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

    // Resolve recruiter code to recruiter ID
    let recruiterId: string | undefined
    if (recruiter_code) {
      const { getTrackingLinkBySlug } = await import('@/lib/creators/db')
      const link = await getTrackingLinkBySlug(recruiter_code)
      if (link) {
        recruiterId = link.creator_id
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
