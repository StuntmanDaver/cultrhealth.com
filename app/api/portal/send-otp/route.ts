export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import twilio from 'twilio'
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import { formatPhoneNumber, isValidPhoneNumber } from '@/lib/asher-med-api'

// Rate limiters
const ipLimiter = rateLimit({ limit: 5, windowMs: 60 * 60 * 1000, prefix: 'otp-send' })
const phoneLimiter = rateLimit({ limit: 5, windowMs: 60 * 60 * 1000, prefix: 'otp-send-phone' })

export async function POST(request: Request) {
  try {
    // 1. Check IP rate limit
    const clientIp = await getClientIp()
    const ipResult = await ipLimiter.check(clientIp)
    if (!ipResult.success) {
      return rateLimitResponse(ipResult)
    }

    // 2. Parse and validate phone
    const body = await request.json()
    const { phone } = body

    if (!phone || !isValidPhoneNumber(phone)) {
      return NextResponse.json(
        { error: 'Please enter a valid phone number.' },
        { status: 400 }
      )
    }

    // 3. Convert to E.164
    const phoneE164 = formatPhoneNumber(phone)

    // 4. Check phone rate limit
    const phoneResult = await phoneLimiter.check(phoneE164)
    if (!phoneResult.success) {
      return rateLimitResponse(phoneResult)
    }

    // 5. Staging bypass — skip Twilio, accept any phone
    const isStaging = (process.env.NEXT_PUBLIC_SITE_URL || '').includes('staging')
    if (isStaging) {
      return NextResponse.json({ success: true, phone: phoneE164 })
    }

    // 6. Send OTP via Twilio Verify
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )

    await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verifications.create({ channel: 'sms', to: phoneE164 })

    // 7. Return success (does NOT reveal whether phone is registered)
    return NextResponse.json({ success: true, phone: phoneE164 })
  } catch (error: unknown) {
    // Map Twilio error codes to user-friendly messages
    const twilioError = error as { code?: number }

    if (twilioError.code === 60203) {
      return NextResponse.json(
        { error: 'Too many OTP requests. Please wait a few minutes.' },
        { status: 429 }
      )
    }

    if (twilioError.code === 20404) {
      return NextResponse.json(
        { error: 'Please enter a valid US phone number.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to send verification code. Please try again.' },
      { status: 500 }
    )
  }
}
