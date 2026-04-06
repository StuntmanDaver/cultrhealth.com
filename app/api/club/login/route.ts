import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { strictLimiter, rateLimitResponse } from '@/lib/rate-limit'
import { createClubVisitorToken } from '@/lib/auth'
import { getCookieDomain } from '@/lib/utils'

function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown'
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request)
    const rateLimitResult = await strictLimiter.check(`club-login:${clientIp}`)
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult)
    }

    const body = await request.json()
    const { email, phone } = body

    // Validate required fields
    if (!email?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { error: 'Email and phone number are required.' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedPhone = phone.trim().replace(/\D/g, '') // Strip all non-digits for comparison

    // Look up member in database
    if (!process.env.POSTGRES_URL) {
      return NextResponse.json(
        { error: 'Database not configured.' },
        { status: 500 }
      )
    }

    try {
      const result = await sql`
        SELECT name, email, phone, social_handle, signup_type, age, gender,
               address_street, address_city, address_state, address_zip
        FROM club_members
        WHERE LOWER(email) = LOWER(${normalizedEmail})
        LIMIT 1
      `

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'No account found with that email.' },
          { status: 404 }
        )
      }

      const member = result.rows[0]
      const storedPhone = member.phone?.replace(/\D/g, '') || ''

      // Verify phone number matches
      if (storedPhone !== normalizedPhone) {
        return NextResponse.json(
          { error: 'Phone number does not match our records.' },
          { status: 401 }
        )
      }

      // Return member data and set cookie
      const nameParts = (member.name || '').split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      const memberData = {
        firstName,
        lastName,
        email: member.email,
        phone: member.phone || '',
        socialHandle: member.social_handle || '',
        signupType: member.signup_type || 'products',
        age: member.age ? Number(member.age) : undefined,
        gender: member.gender || undefined,
        address: member.address_street ? {
          street: member.address_street,
          city: member.address_city || '',
          state: member.address_state || '',
          zip: member.address_zip || '',
        } : undefined,
      }

      const response = NextResponse.json(memberData, { status: 200 })
      const clubVisitorToken = await createClubVisitorToken(member.email)

      // Set visitor cookie (90 days)
      const domain = getCookieDomain()
      response.cookies.set('cultr_club_visitor', clubVisitorToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 90, // 90 days
        path: '/',
        ...(domain ? { domain } : {}),
      })

      return response
    } catch (dbError) {
      console.error('[club/login] DB error:', describeError(dbError))
      return NextResponse.json(
        { error: 'Database error. Please try again.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[club/login] Error:', describeError(error))
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    )
  }
}
