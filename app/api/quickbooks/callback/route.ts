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

  console.log('[quickbooks/callback] OAuth2 complete — REALM_ID:', realmId)
  console.log('[quickbooks/callback] REFRESH_TOKEN (first 20):', tokens.refresh_token?.slice(0, 20))

  return new NextResponse(
    successPage(realmId, tokens.refresh_token, tokens.access_token),
    { headers: { 'Content-Type': 'text/html' } }
  )
}

function successPage(realmId: string, refreshToken: string, accessToken: string) {
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
    .value { font-family: 'Courier New', monospace; font-size: 13px; word-break: break-all; background: #f5f0e8; padding: 10px 12px; border-radius: 8px; user-select: all; }
    .step { display: flex; gap: 12px; margin: 12px 0; }
    .num { background: #2A4542; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; margin-top: 2px; }
    .warning { background: #fff3cd; border: 1px solid #ffc10720; border-radius: 8px; padding: 12px 16px; font-size: 13px; margin-top: 20px; }
  </style>
</head>
<body>
  <h1>QuickBooks Connected!</h1>
  <div class="badge">OAuth2 Complete</div>
  <p>Copy these two values into your <strong>Vercel environment variables</strong> for both staging and production environments.</p>

  <div class="card">
    <div class="label">QUICKBOOKS_REALM_ID (Company ID)</div>
    <div class="value">${realmId}</div>
  </div>

  <div class="card">
    <div class="label">QUICKBOOKS_REFRESH_TOKEN</div>
    <div class="value">${refreshToken}</div>
  </div>

  <h3 style="margin-top: 28px;">Next Steps</h3>
  <div class="step"><div class="num">1</div><div>Go to <strong>Vercel → Your Project → Settings → Environment Variables</strong></div></div>
  <div class="step"><div class="num">2</div><div>Add <code>QUICKBOOKS_REALM_ID</code> = the value above</div></div>
  <div class="step"><div class="num">3</div><div>Add <code>QUICKBOOKS_REFRESH_TOKEN</code> = the value above</div></div>
  <div class="step"><div class="num">4</div><div>Also confirm <code>QUICKBOOKS_CLIENT_ID</code>, <code>QUICKBOOKS_CLIENT_SECRET</code>, and <code>QUICKBOOKS_SANDBOX</code> are set</div></div>
  <div class="step"><div class="num">5</div><div>Redeploy to pick up the new env vars</div></div>

  <div class="warning">
    ⚠️ <strong>Security:</strong> Close this browser tab after copying the tokens. Do not share the refresh token — it grants full QB Accounting access to your company.
  </div>
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
