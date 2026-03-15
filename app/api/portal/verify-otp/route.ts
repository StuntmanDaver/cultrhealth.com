export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import twilio from 'twilio'
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import { formatPhoneNumber, isValidPhoneNumber, getPatientByPhone } from '@/lib/asher-med-api'
import {
  createPortalAccessToken,
  createPortalRefreshToken,
  setPortalCookies,
} from '@/lib/portal-auth'
import {
  getPortalSessionByPhone,
  upsertPortalSession,
} from '@/lib/portal-db'

// Rate limiter
const verifyLimiter = rateLimit({ limit: 10, windowMs: 60 * 60 * 1000, prefix: 'otp-verify' })

export async function POST(request: Request) {
  try {
    // 1. Rate limit by IP
    const clientIp = await getClientIp()
    const ipResult = await verifyLimiter.check(clientIp)
    if (!ipResult.success) {
      return rateLimitResponse(ipResult)
    }

    // 2. Parse phone and code
    const body = await request.json()
    const { phone, code } = body

    // 3. Validate inputs
    if (!phone || !isValidPhoneNumber(phone)) {
      return NextResponse.json(
        { error: 'Please enter a valid phone number.' },
        { status: 400 }
      )
    }

    if (!code || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Please enter a valid 6-digit code.' },
        { status: 400 }
      )
    }

    // 4. Convert phone to E.164
    const phoneE164 = formatPhoneNumber(phone)

    // 5. Staging / local dev bypass: accept code 123456 without Twilio
    const isStaging = (process.env.NEXT_PUBLIC_SITE_URL || '').includes('staging')
    const isLocalDev = process.env.NODE_ENV === 'development'
    const isDevBypass = (isStaging || isLocalDev) && code === '123456'

    // Local dev only: skip everything after OTP and go straight to dashboard
    if (isLocalDev && isDevBypass) {
      const accessToken = await createPortalAccessToken(phoneE164, null)
      const refreshToken = await createPortalRefreshToken(phoneE164, null)
      await setPortalCookies(accessToken, refreshToken)
      return NextResponse.json({
        success: true,
        hasPatient: true,
        knownPhone: true,
        redirect: '/portal/dashboard',
      })
    }

    if (!isDevBypass) {
      // 6. Verify OTP via Twilio
      try {
        const client = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        )

        const check = await client.verify.v2
          .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
          .verificationChecks.create({ code, to: phoneE164 })

        if (check.status !== 'approved') {
          return NextResponse.json(
            { error: 'Invalid or expired code. Please try again.' },
            { status: 401 }
          )
        }
      } catch (error: unknown) {
        const twilioError = error as { code?: number }

        if (twilioError.code === 60200) {
          return NextResponse.json(
            { error: "That code didn't match. Please check and try again." },
            { status: 401 }
          )
        }

        if (twilioError.code === 60202) {
          return NextResponse.json(
            { error: 'Too many attempts. Please request a new code.' },
            { status: 401 }
          )
        }

        return NextResponse.json(
          { error: 'Invalid or expired code. Please try again.' },
          { status: 401 }
        )
      }
    }

    // 7. OTP verified -- resolve patient identity
    // a. Check local DB for existing session
    const existingSession = await getPortalSessionByPhone(phoneE164)
    const knownPhone = existingSession !== null

    // b. Try Asher Med patient lookup
    let asherPatient = null
    try {
      asherPatient = await getPatientByPhone(phoneE164)
    } catch {
      // Asher Med may be down -- fall back to cached data
    }

    // c. Determine patient ID: Asher Med takes priority, fall back to cached
    const patientId = asherPatient?.id ?? existingSession?.asher_patient_id ?? null

    // 8. Create session tokens (always -- phone is verified regardless of patient status)
    const accessToken = await createPortalAccessToken(phoneE164, patientId)
    const refreshToken = await createPortalRefreshToken(phoneE164, patientId)

    // 9. Set cookies
    await setPortalCookies(accessToken, refreshToken)

    // 10. Upsert portal session to cache phone-to-patient mapping
    await upsertPortalSession(
      phone,
      phoneE164,
      patientId,
      asherPatient?.firstName,
      asherPatient?.lastName
    )

    // 11. Return response based on three cases
    const hasPatient = patientId !== null

    if (hasPatient) {
      // Case A: Patient found (Asher Med or cached)
      return NextResponse.json({
        success: true,
        hasPatient: true,
        knownPhone: true,
        redirect: '/portal/dashboard',
      })
    }

    if (knownPhone) {
      // Case B: Known phone, no patient (e.g., previously verified, intake not complete)
      return NextResponse.json({
        success: true,
        hasPatient: false,
        knownPhone: true,
        redirect: '/intake',
      })
    }

    // Case C: Never-seen phone (no local DB row AND no Asher Med patient)
    return NextResponse.json({
      success: true,
      hasPatient: false,
      knownPhone: false,
    })
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
