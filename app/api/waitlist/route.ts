import { NextRequest, NextResponse } from 'next/server'
import { waitlistSchema, newsletterSchema } from '@/lib/validation'
import { formLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // 0. Rate limiting check
    const clientIp = await getClientIp()
    const rateLimitResult = await formLimiter.check(clientIp)
    
    if (!rateLimitResult.success) {
      console.log('Rate limit exceeded:', { ip: clientIp, reset: rateLimitResult.reset })
      return rateLimitResponse(rateLimitResult)
    }

    const body = await request.json()
    
    // Extract turnstile token and source
    const { turnstileToken, source, ...formData } = body
    const isNewsletter = source === 'newsletter'

    // 1. Verify Turnstile token (if configured)
    if (process.env.TURNSTILE_SECRET_KEY) {
      if (!turnstileToken || turnstileToken === 'pending-setup') {
        return NextResponse.json(
          { error: 'Verification required. Please complete the captcha.' },
          { status: 400 }
        )
      }
      const { verifyTurnstileToken } = await import('@/lib/turnstile')
      const turnstileResult = await verifyTurnstileToken(turnstileToken)
      if (!turnstileResult.success) {
        return NextResponse.json(
          { error: 'Verification failed. Please try again.' },
          { status: 400 }
        )
      }
    }

    // 2. Validate input (use relaxed schema for newsletter signups)
    let name: string
    let email: string
    let phone: string
    let social_handle: string | undefined
    let treatment_reason: string | undefined

    if (isNewsletter) {
      const result = newsletterSchema.safeParse(formData)
      if (!result.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: result.error.errors },
          { status: 400 }
        )
      }
      name = 'Newsletter Subscriber'
      email = result.data.email
      phone = ''
    } else {
      const result = waitlistSchema.safeParse(formData)
      if (!result.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: result.error.errors },
          { status: 400 }
        )
      }
      name = result.data.name
      email = result.data.email
      phone = result.data.phone
      social_handle = result.data.social_handle || undefined
      treatment_reason = result.data.treatment_reason || undefined
    }

    // 3. Try to save to database (if configured)
    let waitlistId = crypto.randomUUID()

    if (process.env.POSTGRES_URL) {
      try {
        const { createWaitlistEntry } = await import('@/lib/db')
        const dbResult = await createWaitlistEntry({
          name,
          email,
          phone,
          social_handle,
          treatment_reason,
          source: isNewsletter ? 'newsletter' : undefined,
        })
        waitlistId = dbResult.id
      } catch (dbError) {
        console.error('Database error (continuing without DB):', dbError)
      }
    }

    // Log the submission
    console.log('Waitlist signup:', { 
      waitlist_id: waitlistId,
      source: isNewsletter ? 'newsletter' : 'waitlist',
      name, 
      email, 
      phone: phone || undefined, 
      social_handle, 
      treatment_reason,
      timestamp: new Date().toISOString()
    })

    // 4. Send founder notification email (if configured)
    if (process.env.RESEND_API_KEY) {
      const { sendFounderNotification } = await import('@/lib/resend')
      sendFounderNotification({
        waitlist_id: waitlistId,
        name,
        email,
        phone,
        social_handle,
        treatment_reason,
        timestamp: new Date(),
      }).catch((emailError) => {
        console.error('Failed to send founder notification:', emailError)
      })
    } else {
      console.warn('Email notifications disabled: RESEND_API_KEY not configured')
    }

    // 5. Return success
    return NextResponse.json({
      success: true,
      waitlist_id: waitlistId,
      message: isNewsletter
        ? 'Successfully subscribed to the newsletter'
        : 'Successfully joined the waitlist',
    })

  } catch (error) {
    console.error('Waitlist API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
