import { cookies } from 'next/headers'
import { sql } from '@vercel/postgres'
import { JoinLandingClient } from './JoinLandingClient'

export const dynamic = 'force-dynamic'

/**
 * Server-side member recognition.
 *
 * Reads the cultr_club_visitor cookie, extracts the email, and verifies
 * the member exists in the club_members DB table. Passes verified member
 * data as a prop so the client never shows the signup modal for known members.
 *
 * This handles the case where localStorage was cleared but the cookie
 * (90-day TTL) is still present — the server confirms via DB lookup.
 */
async function getServerMember(): Promise<{
  firstName: string
  lastName: string
  email: string
  phone: string
  socialHandle: string
  signupType: string
  age?: number
  gender?: string
  address?: { street: string; city: string; state: string; zip: string }
} | null> {
  try {
    const cookieStore = cookies()
    const visitorCookie = cookieStore.get('cultr_club_visitor')

    if (!visitorCookie?.value) return null

    let cookieData: { email?: string; firstName?: string; lastName?: string; phone?: string; socialHandle?: string; signupType?: string; address?: { street: string; city: string; state: string; zip: string } }
    try {
      cookieData = JSON.parse(decodeURIComponent(visitorCookie.value))
    } catch {
      return null
    }

    if (!cookieData.email) return null

    // If no DB configured, trust the cookie data if it has required fields
    if (!process.env.POSTGRES_URL) {
      if (cookieData.firstName && cookieData.lastName && cookieData.email && cookieData.phone) {
        return {
          firstName: cookieData.firstName,
          lastName: cookieData.lastName,
          email: cookieData.email,
          phone: cookieData.phone,
          socialHandle: cookieData.socialHandle || '',
          signupType: cookieData.signupType || 'products',
        }
      }
      return null
    }

    // Verify member exists in DB
    const result = await sql`
      SELECT name, email, phone, social_handle, signup_type, age, gender,
             address_street, address_city, address_state, address_zip
      FROM club_members
      WHERE LOWER(email) = LOWER(${cookieData.email.trim()})
      LIMIT 1
    `

    if (result.rows.length === 0) return null

    const row = result.rows[0]
    const nameParts = (row.name || '').split(' ')

    return {
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
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
    }
  } catch (error) {
    // Non-blocking — if DB check fails, fall through to client-side recognition
    console.error('[join/page] Server member check failed:', error instanceof Error ? error.message : 'unknown')
    return null
  }
}

export default async function JoinClubPage() {
  const serverMember = await getServerMember()
  return <JoinLandingClient serverMember={serverMember} />
}
