import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/quickbooks/callback
 *
 * Handles the OAuth2 callback from Intuit after authorization.
 * Exchanges the authorization code for access + refresh tokens,
 * then displays the tokens for you to copy into Vercel env vars.
 *
 * Required Vercel env vars to set after this flow:
 *   QUICKBOOKS_REFRESH_TOKEN  — from this response
 *   QUICKBOOKS_REALM_ID       — from the realmId query param (company ID)
 *
 * This endpoint itself does NOT persist tokens to the DB — it just
 * shows them so you can set them as environment variables in Vercel.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const realmId = url.searchParams.get('realmId')
  const error = url.searchParams.get('error')
  const providedState = url.searchParams.get('state')
  const expectedState = request.cookies.get('qb_oauth_state')?.value

  if (!providedState || !expectedState || !safeEqual(providedState, expectedState)) {
    return clearStateCookie(new NextResponse(
      errorPage('Invalid OAuth state. Restart the authorization flow.'),
      { headers: { 'Content-Type': 'text/html' }, status: 401 }
    ))
  }

  if (error) {
    return new NextResponse(
      errorPage(`QuickBooks authorization failed: ${error}`),
      { headers: { 'Content-Type': 'text/html' } }
    )
  }

  if (!code || !realmId) {
    return new NextResponse(
      errorPage('Missing code or realmId from QuickBooks callback.'),
      { headers: { 'Content-Type': 'text/html' } }
    )
  }

  const clientId = process.env.QUICKBOOKS_CLIENT_ID
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET
  const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    return new NextResponse(
      errorPage('Missing QUICKBOOKS_CLIENT_ID, QUICKBOOKS_CLIENT_SECRET, or QUICKBOOKS_REDIRECT_URI env vars.'),
      { headers: { 'Content-Type': 'text/html' } }
    )
  }

  // Exchange authorization code for tokens
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text()
    console.error('[quickbooks/callback] Token exchange failed:', tokenResponse.status, errorText)
    return new NextResponse(
      errorPage(`Token exchange failed (${tokenResponse.status}): ${errorText}`),
      { headers: { 'Content-Type': 'text/html' } }
    )
  }

  const tokens = await tokenResponse.json() as {
    access_token: string
    refresh_token: string
    expires_in: number
    token_type: string
  }

  // Store tokens in DB — never expose them in the browser response
  try {
    const { sql } = await import('@vercel/postgres')
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    await sql`
      INSERT INTO qb_tokens (key, access_token, refresh_token, expires_at, updated_at)
      VALUES ('main', ${tokens.access_token}, ${tokens.refresh_token}, ${expiresAt}, NOW())
      ON CONFLICT (key) DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW()
    `
  } catch (err) {
    console.error('[quickbooks/callback] Failed to store tokens in DB:', err)
    return clearStateCookie(new NextResponse(
      errorPage('Tokens were exchanged but could not be saved to the database. Check server logs.'),
      { headers: { 'Content-Type': 'text/html' }, status: 500 }
    ))
  }

  console.log('[quickbooks/callback] OAuth2 complete for realm:', realmId)

  return clearStateCookie(new NextResponse(
    successPage(realmId),
    { headers: { 'Content-Type': 'text/html' } }
  ))
}

function successPage(realmId: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>QuickBooks Connected — CULTR Health</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #FDFBF7; color: #2A4542; padding: 40px 20px; max-width: 700px; margin: 0 auto; }
    h1 { font-size: 24px; margin-bottom: 8px; }
    .badge { display: inline-block; background: #D8F3DC; color: #2A4542; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 600; margin-bottom: 24px; }
    .card { background: white; border: 1px solid #2A454220; border-radius: 12px; padding: 20px; margin: 16px 0; }
    .label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #2A454280; margin-bottom: 8px; }
    .value { font-family: 'Courier New', monospace; font-size: 13px; word-break: break-all; background: #f5f0e8; padding: 10px 12px; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>QuickBooks Connected!</h1>
  <div class="badge">OAuth2 Complete</div>
  <p>Tokens have been stored securely in the database. No credentials are displayed here.</p>

  <div class="card">
    <div class="label">QUICKBOOKS_REALM_ID (Company ID)</div>
    <div class="value">${realmId}</div>
  </div>

  <p style="font-size: 14px; color: #3A5956;">
    Set <code>QUICKBOOKS_REALM_ID</code> to the value above in your Vercel environment variables,
    then redeploy. The access and refresh tokens are already saved in the database.
  </p>
</body>
</html>`
}

function errorPage(message: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>QuickBooks Error — CULTR Health</title>
  <style>body { font-family: -apple-system, sans-serif; background: #FDFBF7; color: #2A4542; padding: 40px 20px; max-width: 600px; margin: 0 auto; }</style>
</head>
<body>
  <h1>QuickBooks Connection Error</h1>
  <p style="background: #fee2e2; border-radius: 8px; padding: 16px; font-size: 14px;">${message}</p>
  <p>Go back and try <a href="/api/quickbooks/auth">restarting the OAuth flow</a>.</p>
</body>
</html>`
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  return aBuf.length === bBuf.length && crypto.timingSafeEqual(aBuf, bBuf)
}

function clearStateCookie(response: NextResponse): NextResponse {
  response.cookies.set('qb_oauth_state', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/api/quickbooks/callback',
  })
  return response
}
