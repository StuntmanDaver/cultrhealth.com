import { NextRequest, NextResponse } from 'next/server'
import { getSession, isProviderEmail } from '@/lib/auth'
import { getCustomerFullProfile } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is an admin
    const adminEmails = process.env.ADMIN_ALLOWED_EMAILS || process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS || ''
    const allowedEmails = adminEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
    const isAdmin = allowedEmails.includes(session.email.toLowerCase()) || isProviderEmail(session.email)

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const email = decodeURIComponent(params.email)
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email parameter required' },
        { status: 400 }
      )
    }

    const profile = await getCustomerFullProfile(email)

    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    console.error('Admin customer profile error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer profile' },
      { status: 500 }
    )
  }
}
