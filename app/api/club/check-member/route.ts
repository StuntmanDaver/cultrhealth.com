import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { cookies } from 'next/headers'
import { strictLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import { verifyClubVisitorToken } from '@/lib/auth'

/**
 * GET /api/club/check-member
 *
 * Server-side member recognition. Two modes:
 * 1. No query params — reads the signed cultr_club_visitor cookie and verifies via DB.
 *    Returns full member data only when the session token is valid.
 * 2. ?email=... — looks up member by email (for signup form auto-fill)
 *    Returns MINIMAL data only (firstName + exists flag). No PII.
 *    This mode is unauthenticated — never return phone, address, or sensitive data.
 *
 * Returns member data if found. Email lookups always return 200 (anti-enumeration).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const emailParam = searchParams.get('email')?.trim().toLowerCase()

    // Determine lookup mode: email query param = untrusted, cookie = trusted
    const isEmailLookup = !!emailParam
    let lookupEmail: string | null = emailParam || null

    if (isEmailLookup) {
      const clientIp = await getClientIp()
      const rateLimitResult = await strictLimiter.check(`club-check-member:${clientIp}`)
      if (!rateLimitResult.success) {
        return rateLimitResponse(rateLimitResult)
      }
    }

    if (!lookupEmail) {
      const cookieStore = cookies()
      const visitorCookie = cookieStore.get('cultr_club_visitor')

      if (!visitorCookie?.value) {
        return NextResponse.json({ member: null }, { status: 404 })
      }

      const cookieData = await verifyClubVisitorToken(visitorCookie.value)
      if (!cookieData) {
        return NextResponse.json({ member: null }, { status: 404 })
      }

      lookupEmail = cookieData.email
    }

    if (!lookupEmail) {
      return NextResponse.json({ member: null }, { status: 404 })
    }

    if (!process.env.POSTGRES_URL) {
      return NextResponse.json({ member: null }, { status: 404 })
    }

    const result = await sql`
      SELECT name, email, phone, social_handle, signup_type, age, gender,
             address_street, address_city, address_state, address_zip
      FROM club_members
      WHERE LOWER(email) = LOWER(${lookupEmail})
      LIMIT 1
    `

    if (result.rows.length === 0) {
      // SECURITY: For email lookups, always return 200 to prevent enumeration.
      // For cookie lookups, 404 is fine (no info leak — cookie is self-identifying).
      if (isEmailLookup) {
        return NextResponse.json({ member: null })
      }
      return NextResponse.json({ member: null }, { status: 404 })
    }

    const row = result.rows[0]
    const nameParts = (row.name || '').split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    // SECURITY: Email-based lookups are unauthenticated.
    // Only return first name (for "Welcome back, {name}!" UX).
    // Never return phone, address, age, gender, or other PII.
    // Always returns 200 to prevent email enumeration.
    if (isEmailLookup) {
      return NextResponse.json({
        member: {
          firstName,
          exists: true,
        },
        source: 'database',
      })
    }

    // Signed cookie lookups return full data after the token is verified.
    return NextResponse.json({
      member: {
        firstName,
        lastName,
        email: row.email,
        phone: row.phone || '',
        socialHandle: row.social_handle || '',
        signupType: row.signup_type || 'products',
        age: row.age ? Number(row.age) : undefined,
        gender: row.gender || undefined,
        address: row.address_street ? {
          street: row.address_street,
          city: row.address_city || '',
          state: row.address_state || '',
          zip: row.address_zip || '',
        } : undefined,
      },
      source: 'database',
    })
  } catch (error) {
    console.error('[club/check-member] Error:', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ member: null }, { status: 500 })
  }
}
