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
const QB_TOKEN_KEY = 'main'

let cachedAccessToken: string | null = null
let tokenExpiresAt = 0

/**
 * Get a valid access token, refreshing if needed.
 *
 * Token priority (most → least current):
 *   1. In-memory cache (avoids DB hit within same function lifecycle)
 *   2. qb_tokens DB table (survives cold starts, always has latest rotated token)
 *   3. QUICKBOOKS_REFRESH_TOKEN env var (initial seed only — will go stale after first rotation)
 *
 * After every token refresh QB issues a new refresh_token. We persist it to DB
 * so subsequent cold starts don't use the stale env var.
 */
export async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.warn('[quickbooks] Missing QB credentials (CLIENT_ID or CLIENT_SECRET)')
    return null
  }

  // 1. In-memory cache — valid within the same function lifecycle
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedAccessToken
  }

  // 2. Try DB — may have a valid access token or a more current refresh token
  let refreshToken: string | null = process.env.QUICKBOOKS_REFRESH_TOKEN || null

  if (process.env.POSTGRES_URL) {
    try {
      const { sql } = await import('@vercel/postgres')
      const result = await sql`
        SELECT access_token, refresh_token, expires_at
        FROM qb_tokens
        WHERE key = ${QB_TOKEN_KEY}
      `
      if (result.rows.length > 0) {
        const row = result.rows[0]
        // Use the DB refresh token — it's always more current than the env var
        refreshToken = row.refresh_token

        // If DB access token is still valid, use it directly (no QB API call needed)
        const dbExpiresAt = new Date(row.expires_at).getTime()
        if (row.access_token && Date.now() < dbExpiresAt - 60_000) {
          cachedAccessToken = row.access_token
          tokenExpiresAt = dbExpiresAt
          return cachedAccessToken
        }
      }
    } catch (dbError) {
      console.warn('[quickbooks] Could not read token from DB, falling back to env var:', dbError)
    }
  }

  if (!refreshToken) {
    console.warn('[quickbooks] No refresh token available (checked DB and QUICKBOOKS_REFRESH_TOKEN env var)')
    return null
  }

  // 3. Exchange refresh token for new access token
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
      return null
    }

    const data = await response.json() as { access_token: string; expires_in: number; refresh_token?: string }
    cachedAccessToken = data.access_token
    tokenExpiresAt = Date.now() + data.expires_in * 1000
    const newRefreshToken = data.refresh_token || refreshToken

    // Persist both tokens to DB — this is what keeps the integration alive long-term
    if (process.env.POSTGRES_URL) {
      try {
        const { sql } = await import('@vercel/postgres')
        const expiresAt = new Date(tokenExpiresAt).toISOString()
        await sql`
          INSERT INTO qb_tokens (key, access_token, refresh_token, expires_at, updated_at)
          VALUES (${QB_TOKEN_KEY}, ${cachedAccessToken}, ${newRefreshToken}, ${expiresAt}, NOW())
          ON CONFLICT (key) DO UPDATE SET
            access_token = EXCLUDED.access_token,
            refresh_token = EXCLUDED.refresh_token,
            expires_at = EXCLUDED.expires_at,
            updated_at = NOW()
        `
      } catch (dbError) {
        // Non-fatal — tokens still work in memory for this request
        console.warn('[quickbooks] Could not persist token to DB:', dbError)
      }
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
    console.error(`[quickbooks] ${options.method || 'GET'} ${path} failed:`, response.status, text.slice(0, 500))
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
    const emailEscaped = email.replace(/'/g, "\\'")

    // Search by email — QB Online uses 'Email' field in IDS queries
    const emailQuery = encodeURIComponent(`SELECT * FROM Customer WHERE Email = '${emailEscaped}'`)
    const emailSearchRes = await qbFetch(accessToken, `/query?query=${emailQuery}`)
    if (emailSearchRes.ok) {
      const data = await emailSearchRes.json() as { QueryResponse?: { Customer?: Array<{ Id: string }> } }
      const existing = data.QueryResponse?.Customer?.[0]
      if (existing?.Id) {
        console.log('[quickbooks] Found existing customer by email:', existing.Id)
        return existing.Id
      }
    }

    // Fall back: search by DisplayName in case email query is unsupported
    const nameEscaped = displayName.slice(0, 41).replace(/'/g, "\\'")
    const nameQuery = encodeURIComponent(`SELECT * FROM Customer WHERE DisplayName = '${nameEscaped}'`)
    const nameSearchRes = await qbFetch(accessToken, `/query?query=${nameQuery}`)
    if (nameSearchRes.ok) {
      const data = await nameSearchRes.json() as { QueryResponse?: { Customer?: Array<{ Id: string }> } }
      const existing = data.QueryResponse?.Customer?.[0]
      if (existing?.Id) {
        console.log('[quickbooks] Found existing customer by name:', existing.Id)
        return existing.Id
      }
    }

    // Create new customer
    console.log('[quickbooks] Creating new customer for:', email)
    const [givenName, ...familyNameParts] = displayName.split(' ')

    const createRes = await qbFetch(accessToken, '/customer', {
      method: 'POST',
      body: JSON.stringify({
        DisplayName: displayName.slice(0, 41),
        PrimaryEmailAddr: { Address: email },
        GivenName: givenName || displayName,
        FamilyName: familyNameParts.join(' ') || 'Customer',
      }),
    })

    if (!createRes.ok) {
      const errorText = await createRes.text()
      console.error('[quickbooks] Create customer failed:', errorText)

      // If duplicate name, the customer exists under a different email — search by name
      if (errorText.includes('6240') || errorText.toLowerCase().includes('duplicate')) {
        console.log('[quickbooks] Duplicate name detected, searching by DisplayName...')
        const dupQuery = encodeURIComponent(`SELECT * FROM Customer WHERE DisplayName = '${nameEscaped}'`)
        const dupRes = await qbFetch(accessToken, `/query?query=${dupQuery}`)
        if (dupRes.ok) {
          const dupData = await dupRes.json() as { QueryResponse?: { Customer?: Array<{ Id: string }> } }
          const dupCustomer = dupData.QueryResponse?.Customer?.[0]
          if (dupCustomer?.Id) {
            console.log('[quickbooks] Resolved duplicate — using existing customer:', dupCustomer.Id)
            return dupCustomer.Id
          }
        }
      }

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
  orderNumber: string,
  discountPercent: number = 0,
  couponCode?: string
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

    const subtotalBeforeDiscount = lineItems.reduce((sum, line) => sum + line.Amount, 0)

    // Add discount line if a coupon was applied
    if (discountPercent > 0) {
      const discountAmount = Math.round(subtotalBeforeDiscount * discountPercent) / 100
      const discountLabel = couponCode
        ? `Discount (${couponCode} — ${discountPercent}% off)`
        : `Discount (${discountPercent}% off)`
      lineItems.push({
        LineNum: lineItems.length + 1,
        Amount: -Number(discountAmount.toFixed(2)),
        DetailType: 'SalesItemLineDetail',
        Description: discountLabel,
        SalesItemLineDetail: {
          ItemRef: { value: itemRef },
          Qty: 1,
          UnitPrice: -Number(discountAmount.toFixed(2)),
        },
      })
    }

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
      AllowOnlineCreditCardPayment: true,
      AllowOnlineACHPayment: true,
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

    console.log('[quickbooks] Created invoice:', invoice.Id, '| InvoiceLink:', invoice.InvoiceLink || 'NULL')

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
 * Send a QuickBooks invoice to the customer via QB's email.
 * QB will email the invoice with a Pay Now button.
 * Returns the payment link URL (even if email send fails).
 *
 * QB API: POST /invoice/{id}/send?sendTo={email}
 */
export async function sendInvoice(
  accessToken: string,
  invoiceId: string,
  customerEmail?: string
): Promise<{ payNowLink: string | null } | null> {
  try {
    const isSandbox = process.env.QUICKBOOKS_SANDBOX === 'true'
    const appBase = isSandbox
      ? 'https://app.sandbox.qbo.intuit.com'
      : 'https://app.qbo.intuit.com'
    const fallbackLink = `${appBase}/app/invoice?txnId=${invoiceId}`

    // Build send URL — sendTo is required for QB to email the customer
    const sendPath = customerEmail
      ? `/invoice/${invoiceId}/send?sendTo=${encodeURIComponent(customerEmail)}`
      : `/invoice/${invoiceId}/send`

    const sendRes = await qbFetch(accessToken, sendPath, {
      method: 'POST',
      headers: {
        // QB send invoice requires octet-stream with empty body
        'Content-Type': 'application/octet-stream',
      },
    })

    if (!sendRes.ok) {
      const errorText = await sendRes.text()
      console.warn('[quickbooks] Send invoice request failed, returning fallback payment link:', errorText.slice(0, 200))
      // Non-fatal — invoice was created, just not emailed via QB. Return fallback link.
      return { payNowLink: fallbackLink }
    }

    // QB send response includes the invoice with an InvoiceLink (customer-facing pay URL)
    let payNowLink = fallbackLink
    try {
      const sendData = await sendRes.json() as { Invoice?: { Id: string; InvoiceLink?: string } }
      if (sendData.Invoice?.InvoiceLink) {
        payNowLink = sendData.Invoice.InvoiceLink
        console.log('[quickbooks] InvoiceLink from send response:', payNowLink)
      } else {
        console.log('[quickbooks] No InvoiceLink in send response, using fallback:', fallbackLink)
      }
    } catch {
      // JSON parse failed — use fallback link
      console.log('[quickbooks] Failed to parse send response, using fallback:', fallbackLink)
    }

    console.log('[quickbooks] Invoice sent successfully:', invoiceId, 'to:', customerEmail)
    return { payNowLink }
  } catch (error) {
    console.error('[quickbooks] sendInvoice error:', error)
    return null
  }
}

/**
 * Fetch the InvoiceLink for an existing invoice via GET.
 *
 * After QB Payments is activated, InvoiceLink is a customer-accessible
 * payment page (viewinvoice?docId=...) that does not require a QB login.
 *
 * This GET call is more reliable than depending on the create or send
 * response payloads, which may omit InvoiceLink before QB Payments is active.
 */
export async function getInvoiceLink(
  accessToken: string,
  invoiceId: string
): Promise<string | null> {
  try {
    const res = await qbFetch(accessToken, `/invoice/${invoiceId}`)
    if (!res.ok) {
      console.log('[quickbooks] getInvoiceLink failed with status:', res.status)
      return null
    }
    const data = await res.json() as { Invoice?: { InvoiceLink?: string; AllowOnlineCreditCardPayment?: boolean; AllowOnlineACHPayment?: boolean } }
    const link = data.Invoice?.InvoiceLink || null
    const hasCC = data.Invoice?.AllowOnlineCreditCardPayment
    const hasACH = data.Invoice?.AllowOnlineACHPayment

    console.log('[quickbooks] getInvoiceLink result:', {
      invoiceId,
      link: link || 'NULL',
      allowCC: hasCC,
      allowACH: hasACH,
    })

    return link
  } catch (error) {
    console.error('[quickbooks] getInvoiceLink error:', error)
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
