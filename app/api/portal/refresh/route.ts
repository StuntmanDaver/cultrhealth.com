export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  verifyPortalRefreshToken,
  createPortalAccessToken,
  PORTAL_ACCESS_COOKIE,
  PORTAL_REFRESH_COOKIE,
} from '@/lib/portal-auth'

export async function POST(request: NextRequest) {
  // 1. Read refresh token from cookie
  const refreshToken = request.cookies.get(PORTAL_REFRESH_COOKIE)?.value

  if (!refreshToken) {
    return NextResponse.json(
      { error: 'No refresh token' },
      { status: 401 }
    )
  }

  // 2. Verify refresh token
  const session = await verifyPortalRefreshToken(refreshToken)

  if (!session) {
    return NextResponse.json(
      { error: 'Session expired. Please log in again.' },
      { status: 401 }
    )
  }

  // 3. Create new access token with same phone + patientId
  const newAccessToken = await createPortalAccessToken(
    session.phone,
    session.asherPatientId
  )

  // 4. Set access token cookie on response
  const response = NextResponse.json({ success: true })

  response.cookies.set(PORTAL_ACCESS_COOKIE, newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 900, // 15 minutes
    path: '/',
  })

  return response
}
