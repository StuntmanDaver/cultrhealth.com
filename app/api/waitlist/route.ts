import { NextRequest, NextResponse } from 'next/server'
import { waitlistSchema } from '@/lib/validation'
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
    
    // Extract turnstile token
    const { turnstileToken, ...formData } = body

    // 1. Verify Turnstile token (if configured)
    if (process.env.TURNSTILE_SECRET_KEY && turnstileToken !== 'pending-setup') {
      const { verifyTurnstileToken } = await import('@/lib/turnstile')
      const turnstileResult = await verifyTurnstileToken(turnstileToken)
      if (!turnstileResult.success) {
        return NextResponse.json(
          { error: 'Verification failed. Please try again.' },
          { status: 400 }
        )
      }
    }

    // 2. Validate input
    const result = waitlistSchema.safeParse(formData)
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.errors },
        { status: 400 }
      )
    }

    const { name, email, phone, social_handle, treatment_reason } = result.data

    // 3. Try to save to database (if configured)
    let waitlistId = crypto.randomUUID()

    if (process.env.POSTGRES_URL) {
      try {
        const { createWaitlistEntry } = await import('@/lib/db')
        const dbResult = await createWaitlistEntry({
          name,
          email,
          phone,
          social_handle: social_handle || undefined,
          treatment_reason: treatment_reason || undefined,
        })
        waitlistId = dbResult.id
      } catch (dbError) {
        console.error('Database error (continuing without DB):', dbError)
        // Continue without database - just log the submission
      }
    }

    // Log the submission
    console.log('Waitlist signup:', { 
      waitlist_id: waitlistId,
      name, 
      email, 
      phone, 
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
        social_handle: social_handle || undefined,
        treatment_reason: treatment_reason || undefined,
        timestamp: new Date(),
      }).catch((emailError) => {
        console.error('Failed to send founder notification:', emailError)
      })
    }

    // 5. Return success
    return NextResponse.json({
      success: true,
      waitlist_id: waitlistId,
      message: 'Successfully joined the waitlist',
    })

  } catch (error) {
    console.error('Waitlist API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
