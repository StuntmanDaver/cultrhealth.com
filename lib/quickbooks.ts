/**
 * QuickBooks Online API v3 Client
 *
 * Handles OAuth2 token management and invoice creation for CULTR Club orders.
 *
 * Required environment variables:
 *   QUICKBOOKS_CLIENT_ID
 *   QUICKBOOKS_CLIENT_SECRET
 *   QUICKBOOKS_REALM_ID           (Company/Realm ID from QB)
 *   QUICKBOOKS_REFRESH_TOKEN      (from initial OAuth2 authorization)
 *   QUICKBOOKS_SANDBOX            (optional, 'true' for sandbox, 'false'/'unset' for production)
 *
 * Setup Instructions:
 *   1. Create app at developer.intuit.com (select "Accounting" scope)
 *   2. Configure OAuth2 redirect URI to your callback endpoint
 *   3. Complete OAuth2 flow to get QUICKBOOKS_REFRESH_TOKEN
 *   4. Store all env vars (token auto-refreshes on each use)
 *
 * QB API Docs: https://developer.intuit.com/app/developer/qbo/docs/api/accounting
 */

interface OrderItem {
  therapyId: string
  name: string
  price: number | null
  pricingNote?: string
  note?: string
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
 * Caches token in memory and refreshes automatically.
 */
export async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET
  const refreshToken = process.env.QUICKBOOKS_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    console.warn('[quickbooks] Missing QB credentials (CLIENT_ID, CLIENT_SECRET, or REFRESH_TOKEN)')
    return null
  }

  // Return cached token if still valid (with 60s buffer)
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedAccessToken
  }

  try {
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
      // Return null instead of throwing to allow orders to proceed without QB
      return null
    }

    const data = await response.json() as { access_token: string; expires_in: number; refresh_token?: string }
    cachedAccessToken = data.access_token
    tokenExpiresAt = Date.now() + data.expires_in * 1000

    // Note: QB may return a new refresh_token. In production, you'd want to persist this.
    if (data.refresh_token && data.refresh_token !== refreshToken) {
      console.warn(
        '[quickbooks] New refresh token issued. Update QUICKBOOKS_REFRESH_TOKEN env var:',
        data.refresh_token.slice(0, 10) + '...'
      )
    }

    return cachedAccessToken
  } catch (error) {
    console.error('[quickbooks] Unexpected error getting token:', error)
    return null
  }
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

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  // Log errors for debugging
  if (!response.ok) {
    const text = await response.text()
    console.error(`[quickbooks] ${options.method || 'GET'} ${path} failed:`, response.status, text.slice(0, 200))
  }

  return response
}

// =============================================
// CUSTOMER OPERATIONS
// =============================================

/**
 * Find existing QB customer by email, or create a new one.
 * Returns the QB customer ID, or null if operation fails.
 */
export async function findOrCreateCustomer(
  accessToken: string,
  displayName: string,
  email: string
): Promise<string | null> {
  try {
    // Search for existing customer by email
    const query = encodeURIComponent(
      `SELECT * FROM Customer WHERE PrimaryEmailAddr.Address = '${email.replace(/'/g, "\\'")}'`
    )
    const searchRes = await qbFetch(accessToken, `/query?query=${query}`)

    if (searchRes.ok) {
      const searchData = await searchRes.json() as { QueryResponse?: { Customer?: Array<{ Id: string }> } }
      const existing = searchData.QueryResponse?.Customer?.[0]
      if (existing?.Id) {
        console.log('[quickbooks] Found existing customer:', existing.Id)
        return existing.Id
      }
    }

    // Create new customer
    console.log('[quickbooks] Creating new customer for:', email)
    const [givenName, ...familyNameParts] = displayName.split(' ')

    const createRes = await qbFetch(accessToken, '/customer', {
      method: 'POST',
      body: JSON.stringify({
        DisplayName: displayName.slice(0, 41), // QB limit
        PrimaryEmailAddr: { Address: email },
        GivenName: givenName || displayName,
        FamilyName: familyNameParts.join(' ') || 'Customer',
      }),
    })

    if (!createRes.ok) {
      const errorText = await createRes.text()
      console.error('[quickbooks] Create customer failed:', errorText)
      return null
    }

    const createData = await createRes.json() as { Customer?: { Id: string } }
    const customerId = createData.Customer?.Id

    if (customerId) {
      console.log('[quickbooks] Created customer:', customerId)
      return customerId
    }

    console.error('[quickbooks] No customer ID in response')
    return null
  } catch (error) {
    console.error('[quickbooks] findOrCreateCustomer error:', error)
    return null
  }
}

// =============================================
// INVOICE OPERATIONS
// =============================================

/**
 * Create a QuickBooks invoice for the order.
 * Skips items without prices; QB requires at least one priced line item.
 */
export async function createInvoice(
  accessToken: string,
  customerId: string,
  items: OrderItem[],
  orderNumber: string
): Promise<{ invoiceId: string; invoiceLink: string | null } | null> {
  try {
    // Filter to items with prices (QB requires priced line items)
    const pricedItems = items.filter((item) => item.price !== null && item.price > 0)

    if (pricedItems.length === 0) {
      console.warn('[quickbooks] No priced items in order — cannot create QB invoice')
      return null
    }

    // QB API v3 requires ItemRef in SalesItemLineDetail.
    // Use QUICKBOOKS_ITEM_REF env var (defaults to "1" = Services, which exists in all QB accounts).
    const itemRef = process.env.QUICKBOOKS_ITEM_REF || '1'

    // Build line items for QB API v3
    const lineItems = pricedItems.map((item, idx) => {
      const amount = item.price * item.quantity
      return {
        LineNum: idx + 1,
        Amount: Number(amount.toFixed(2)),
        DetailType: 'SalesItemLineDetail',
        Description: item.note ? `${item.name} — ${item.note}` : item.name,
        SalesItemLineDetail: {
          ItemRef: { value: itemRef },
          Qty: item.quantity,
          UnitPrice: item.price,
        },
      }
    })

    const total = lineItems.reduce((sum, line) => sum + line.Amount, 0)

    // If any items had TBD/null pricing, note them in the invoice memo
    const tbdItems = items.filter((item) => item.price === null || item.price <= 0)
    const customerMemo = tbdItems.length > 0
      ? `Note: ${tbdItems.map((i) => i.name).join(', ')} pricing TBD — will be invoiced separately.`
      : undefined

    const invoiceBody: Record<string, unknown> = {
      CustomerRef: { value: customerId },
      Line: lineItems,
      DueDate: getNet30Date(),
      PrivateNote: `CULTR Club Order: ${orderNumber}`,
      TxnDate: new Date().toISOString().split('T')[0],
    }

    if (customerMemo) {
      invoiceBody.CustomerMemo = { value: customerMemo }
    }

    console.log('[quickbooks] Creating invoice for order:', orderNumber, 'with', pricedItems.length, 'items, total:', total)

    const res = await qbFetch(accessToken, '/invoice', {
      method: 'POST',
      body: JSON.stringify(invoiceBody),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('[quickbooks] Create invoice failed:', errorText)
      return null
    }

    const data = await res.json() as { Invoice?: { Id: string; InvoiceLink?: string } }
    const invoice = data.Invoice

    if (!invoice?.Id) {
      console.error('[quickbooks] No invoice ID in response')
      return null
    }

    console.log('[quickbooks] Created invoice:', invoice.Id)

    return {
      invoiceId: invoice.Id,
      invoiceLink: invoice.InvoiceLink || null,
    }
  } catch (error) {
    console.error('[quickbooks] createInvoice error:', error)
    return null
  }
}

function getNet30Date(): string {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date.toISOString().split('T')[0]
}

/**
 * Send a QuickBooks invoice to the customer.
 * QB will email the invoice with a Pay Now button.
 * Returns the payment link URL (even if email send fails).
 */
export async function sendInvoice(
  accessToken: string,
  invoiceId: string
): Promise<{ payNowLink: string | null } | null> {
  try {
    // First fetch the invoice to get customer email
    const getRes = await qbFetch(accessToken, `/invoice/${invoiceId}`)
    let customerEmail: string | null = null

    if (getRes.ok) {
      const invoiceData = await getRes.json() as {
        Invoice?: {
          CustomerRef?: { value: string }
          BillAddr?: { Email?: string }
        }
      }
      customerEmail = invoiceData.Invoice?.BillAddr?.Email || null
    }

    // Send the invoice via QB API
    const sendRes = await qbFetch(accessToken, `/invoice/${invoiceId}?requestId=send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        sendTo: customerEmail || '',
      }).toString(),
    })

    // Generate payment link (QB format)
    const payNowLink = `${getBaseUrl()}/invoice/${invoiceId}`

    if (!sendRes.ok) {
      const errorText = await sendRes.text()
      console.warn('[quickbooks] Send invoice request failed, but returning payment link:', errorText.slice(0, 100))
      // Non-fatal — invoice was created, just not emailed. Return payment link anyway.
      return { payNowLink }
    }

    console.log('[quickbooks] Invoice sent successfully:', invoiceId)
    return { payNowLink }
  } catch (error) {
    console.error('[quickbooks] sendInvoice error:', error)
    // Return null to signal failure, but approval flow will continue
    return null
  }
}

// =============================================
// SETUP & TROUBLESHOOTING
// =============================================

/**
 * SETUP INSTRUCTIONS:
 *
 * 1. Create QuickBooks App
 *    - Go to developer.intuit.com
 *    - Create a new app (select "Accounting" as app type)
 *    - Note your Client ID and Client Secret
 *
 * 2. Configure OAuth2
 *    - In your app settings, set Redirect URIs
 *    - Example: https://yourdomain.com/api/quickbooks/callback
 *    - Grant scope: com.intuit.quickbooks.accounting
 *
 * 3. Get Initial Refresh Token
 *    - Use QB's OAuth2 flow to authorize
 *    - Save the refresh_token from the response
 *    - QB uses refresh_token to auto-generate access_tokens
 *
 * 4. Set Environment Variables
 *    QUICKBOOKS_CLIENT_ID=xxx
 *    QUICKBOOKS_CLIENT_SECRET=xxx
 *    QUICKBOOKS_REALM_ID=123456789 (company ID from QB)
 *    QUICKBOOKS_REFRESH_TOKEN=xxx
 *    QUICKBOOKS_SANDBOX=true/false (optional, defaults to false)
 *
 * TESTING IN SANDBOX:
 *
 * - Set QUICKBOOKS_SANDBOX=true to use sandbox endpoints
 * - Use fake invoice numbers like "CLB-TEST-001"
 * - QB sandbox auto-creates products/accounts as needed
 *
 * TROUBLESHOOTING:
 *
 * - "Missing QB credentials": Check all 3 env vars are set
 * - "Token refresh failed": Refresh token may be expired; re-auth
 * - "Create customer failed": Email format issue or QB API limit
 * - "Create invoice failed": Missing required field or QB sync issue
 * - "Send invoice failed": Non-critical; invoice still created
 *
 * DISABLE QB GRACEFULLY:
 *
 * - If any QB env vars are missing, QB integration silently disables
 * - Order approval flow continues without QB invoice
 * - Orders remain in 'approved' status instead of 'invoice_sent'
 * - Admin can manually create QB invoice later
 */
