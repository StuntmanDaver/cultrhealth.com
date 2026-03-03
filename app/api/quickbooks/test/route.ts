import { NextResponse } from 'next/server'

const SETUP_SECRET = process.env.QB_SETUP_SECRET || 'cultr-qb-setup-2024'

/**
 * Temporary QB diagnostic endpoint.
 * GET /api/quickbooks/test?secret=<QB_SETUP_SECRET>
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const secret = url.searchParams.get('secret')
  if (secret !== SETUP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, unknown> = {}

  try {
    const qb = await import('@/lib/quickbooks')

    // Step 1: Get access token
    const accessToken = await qb.getAccessToken()
    results.step1_token = accessToken ? `ok (${accessToken.slice(0, 20)}...)` : 'FAILED — null'
    if (!accessToken) return NextResponse.json(results)

    const realmId = process.env.QUICKBOOKS_REALM_ID
    const isSandbox = process.env.QUICKBOOKS_SANDBOX === 'true'
    const base = isSandbox
      ? `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}`
      : `https://quickbooks.api.intuit.com/v3/company/${realmId}`

    results.realm = realmId || 'missing'
    results.sandbox = isSandbox

    // Step 2: Test customer search (raw)
    const testEmail = 'qb-test-diag@cultrhealth.com'
    const query = encodeURIComponent(`SELECT * FROM Customer WHERE PrimaryEmailAddr.Address = '${testEmail}'`)
    const searchRes = await fetch(`${base}/query?query=${query}`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    })
    const searchBody = await searchRes.text()
    results.step2_search = { status: searchRes.status, body: searchBody.slice(0, 400) }

    // Step 3: Test customer create (raw)
    const createRes = await fetch(`${base}/customer`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        DisplayName: 'QB Diag Test User',
        PrimaryEmailAddr: { Address: testEmail },
        GivenName: 'QB',
        FamilyName: 'DiagTest',
      }),
    })
    const createBody = await createRes.text()
    results.step3_create = { status: createRes.status, body: createBody.slice(0, 600) }

    return NextResponse.json(results)
  } catch (err: unknown) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : String(err),
      ...results,
    }, { status: 500 })
  }
}
