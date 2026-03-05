import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function POST(request: Request) {
  try {
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
        SELECT id, name, email, phone, social_handle
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
      const nameParts = member.name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');
      
      const memberData = {
        firstName,
        lastName,
        email: member.email,
        phone: member.phone || '',
        socialHandle: member.social_handle || '',
      }

      const response = NextResponse.json(memberData, { status: 200 })

      // Set visitor cookie (7 days)
      const cookieData = encodeURIComponent(JSON.stringify(memberData))
      response.cookies.set('cultr_club_visitor', cookieData, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })

      return response
    } catch (dbError) {
      console.error('[club/login] DB error:', dbError)
      return NextResponse.json(
        { error: 'Database error. Please try again.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[club/login] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    )
  }
}
