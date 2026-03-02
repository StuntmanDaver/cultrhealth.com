import { NextRequest, NextResponse } from 'next/server'
import { getSession, isProviderEmail } from '@/lib/auth'

/**
 * GET /api/quickbooks/auth
 *
 * Initiates the QuickBooks OAuth2 authorization flow.
 * Admin-only — redirects to Intuit's authorization page.
 *
 * After completing the flow, Intuit redirects to /api/quickbooks/callback
 * where tokens are logged for you to copy into Vercel env vars.
 */
export async function GET(request: NextRequest) {
  // Admin-only: check session
  const session = await getSession()
  const adminEmails = process.env.ADMIN_ALLOWED_EMAILS || process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS || ''
  const allowedEmails = adminEmails.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
  const isAdmin =
    session &&
    (allowedEmails.includes(session.email.toLowerCase()) || isProviderEmail(session.email))

  // One-time setup bypass: ?setup_secret=<QUICKBOOKS_SETUP_SECRET>
  const setupSecret = process.env.QUICKBOOKS_SETUP_SECRET
  const providedSecret = request.nextUrl.searchParams.get('setup_secret')
  const hasSetupBypass = setupSecret && providedSecret === setupSecret

  if (!isAdmin && !hasSetupBypass) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clientId = process.env.QUICKBOOKS_CLIENT_ID
  const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'QUICKBOOKS_CLIENT_ID and QUICKBOOKS_REDIRECT_URI must be set in env vars' },
      { status: 500 }
    )
  }

  const isSandbox = process.env.QUICKBOOKS_SANDBOX === 'true'
  const scope = 'com.intuit.quickbooks.accounting'
  const state = Buffer.from(Date.now().toString()).toString('base64')

  const authUrl = new URL(
    isSandbox
      ? 'https://appcenter.intuit.com/connect/oauth2'
      : 'https://appcenter.intuit.com/connect/oauth2'
  )
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('scope', scope)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('state', state)

  return NextResponse.redirect(authUrl.toString())
}
