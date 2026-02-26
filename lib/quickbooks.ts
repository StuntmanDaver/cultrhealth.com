/**
 * QuickBooks Online API Client
 *
 * Handles OAuth2 token management and invoice creation for CULTR Club orders.
 *
 * Required env vars:
 *   QUICKBOOKS_CLIENT_ID
 *   QUICKBOOKS_CLIENT_SECRET
 *   QUICKBOOKS_REALM_ID        (Company ID)
 *   QUICKBOOKS_REFRESH_TOKEN    (from initial OAuth2 authorization)
 *
 * Setup:
 *   1. Create app at developer.intuit.com (production)
 *   2. Set scope: com.intuit.quickbooks.accounting
 *   3. Complete OAuth2 flow once to get refresh_token
 *   4. Store refresh_token as env var (auto-refreshes after that)
 */

interface OrderItem {
  therapyId: string
  name: string
  price: number | null
  pricingNote?: string
  quantity: number
}

// =============================================
// TOKEN MANAGEMENT
// =============================================

const TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'

let cachedAccessToken: string | null = null
let tokenExpiresAt = 0

/**
 * Get a valid access token, refreshing if needed.
 * Returns null if QuickBooks is not configured.
 */
export async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET
  const refreshToken = process.env.QUICKBOOKS_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    console.warn('[quickbooks] Missing credentials — QB integration disabled')
    return null
  }

  // Return cached token if still valid (with 60s buffer)
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedAccessToken
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[quickbooks] Token refresh failed:', response.status, errorText)
    throw new Error(`QuickBooks token refresh failed: ${response.status}`)
  }

  const data = await response.json()
  cachedAccessToken = data.access_token
  tokenExpiresAt = Date.now() + data.expires_in * 1000

  // Note: QB may return a new refresh_token. In production, you'd want to
  // persist this. For now, the original refresh_token remains valid.
  if (data.refresh_token && data.refresh_token !== refreshToken) {
    console.warn(
      '[quickbooks] New refresh token issued. Update QUICKBOOKS_REFRESH_TOKEN env var:',
      data.refresh_token.slice(0, 10) + '...'
    )
  }

  return cachedAccessToken
}

// =============================================
// API HELPERS
// =============================================

function getBaseUrl(): string {
  const realmId = process.env.QUICKBOOKS_REALM_ID
  if (!realmId) throw new Error('QUICKBOOKS_REALM_ID not configured')

  const isSandbox = process.env.QUICKBOOKS_SANDBOX === 'true'
  const base = isSandbox
    ? 'https://sandbox-quickbooks.api.intuit.com'
    : 'https://quickbooks.api.intuit.com'

  return `${base}/v3/company/${realmId}`
}

async function qbFetch(
  accessToken: string,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${getBaseUrl()}${path}`
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}

// =============================================
// CUSTOMER OPERATIONS
// =============================================

/**
 * Find existing QB customer by email, or create a new one.
 * Returns the QB customer ID.
 */
export async function findOrCreateCustomer(
  accessToken: string,
  displayName: string,
  email: string
): Promise<string> {
  // Search for existing customer by email
  const query = encodeURIComponent(`SELECT * FROM Customer WHERE PrimaryEmailAddr = '${email.replace(/'/g, "\\'")}'`)
  const searchRes = await qbFetch(accessToken, `/query?query=${query}`)

  if (searchRes.ok) {
    const searchData = await searchRes.json()
    const existing = searchData.QueryResponse?.Customer?.[0]
    if (existing) {
      return existing.Id
    }
  }

  // Create new customer
  const createRes = await qbFetch(accessToken, '/customer', {
    method: 'POST',
    body: JSON.stringify({
      DisplayName: displayName,
      PrimaryEmailAddr: { Address: email },
      GivenName: displayName.split(' ')[0] || displayName,
      FamilyName: displayName.split(' ').slice(1).join(' ') || '',
    }),
  })

  if (!createRes.ok) {
    const errorText = await createRes.text()
    console.error('[quickbooks] Create customer failed:', errorText)
    throw new Error('Failed to create QuickBooks customer')
  }

  const createData = await createRes.json()
  return createData.Customer.Id
}

// =============================================
// INVOICE OPERATIONS
// =============================================

/**
 * Create a QuickBooks invoice for the order.
 */
export async function createInvoice(
  accessToken: string,
  customerId: string,
  items: OrderItem[],
  orderNumber: string
): Promise<{ invoiceId: string; invoiceLink: string | null } | null> {
  // Build line items
  const lineItems = items.map((item, idx) => ({
    LineNum: idx + 1,
    Amount: item.price ? item.price * item.quantity : 0,
    DetailType: 'SalesItemLineDetail',
    Description: item.name + (item.pricingNote && !item.price ? ` (${item.pricingNote})` : ''),
    SalesItemLineDetail: {
      Qty: item.quantity,
      UnitPrice: item.price || 0,
    },
  }))

  const invoiceBody = {
    CustomerRef: { value: customerId },
    Line: lineItems,
    CustomField: [
      {
        DefinitionId: '1',
        StringValue: orderNumber,
        Type: 'StringType',
        Name: 'Order Number',
      },
    ],
    PrivateNote: `CULTR Club Order: ${orderNumber}`,
    BillEmail: { Address: '' }, // Will be set when sending
  }

  const res = await qbFetch(accessToken, '/invoice', {
    method: 'POST',
    body: JSON.stringify(invoiceBody),
  })

  if (!res.ok) {
    const errorText = await res.text()
    console.error('[quickbooks] Create invoice failed:', errorText)
    throw new Error('Failed to create QuickBooks invoice')
  }

  const data = await res.json()
  const invoice = data.Invoice

  return {
    invoiceId: invoice.Id,
    invoiceLink: invoice.InvoiceLink || null,
  }
}

/**
 * Send a QuickBooks invoice to the customer.
 * QB sends its own email with the Pay Now button.
 * Returns the payment link URL.
 */
export async function sendInvoice(
  accessToken: string,
  invoiceId: string
): Promise<{ payNowLink: string | null } | null> {
  const res = await qbFetch(accessToken, `/invoice/${invoiceId}/send`, {
    method: 'POST',
  })

  if (!res.ok) {
    const errorText = await res.text()
    console.error('[quickbooks] Send invoice failed:', errorText)
    // Non-fatal — invoice was created, just not emailed
    return null
  }

  const data = await res.json()
  return {
    payNowLink: data.Invoice?.InvoiceLink || null,
  }
}
