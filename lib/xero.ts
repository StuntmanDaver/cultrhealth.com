/**
 * Xero Accounting API v2 Client
 *
 * OAuth2 token management and invoice operations for CULTR billing.
 * Mirrors the lib/quickbooks.ts pattern.
 *
 * Required env vars:
 *   XERO_CLIENT_ID
 *   XERO_CLIENT_SECRET
 *   XERO_REFRESH_TOKEN   (from initial OAuth2 authorization)
 *   XERO_TENANT_ID       (Xero organization/tenant GUID)
 *
 * Webhook env vars:
 *   XERO_WEBHOOK_KEY     (from Xero developer portal → Webhooks)
 *
 * Docs: https://developer.xero.com/documentation/api/accounting/overview
 */

const XERO_TOKEN_URL = 'https://identity.xero.com/connect/token'
const XERO_API_BASE = 'https://api.xero.com/api.xro/2.0'
const XERO_TOKEN_KEY = 'main'

let cachedAccessToken: string | null = null
let tokenExpiresAt = 0

export interface XeroInvoice {
  InvoiceID: string
  InvoiceNumber?: string
  Status: string        // DRAFT | SUBMITTED | AUTHORISED | PAID | VOIDED
  Type: string          // ACCREC | ACCPAY
  AmountDue: number
  AmountPaid: number
  Total: number
  DueDate?: string
  Contact?: { ContactID: string; Name: string; EmailAddress?: string }
}

// =============================================
// TOKEN MANAGEMENT
// =============================================

/**
 * Get a valid Xero access token, refreshing via OAuth2 if expired.
 *
 * Priority:
 *   1. In-memory cache
 *   2. xero_tokens DB table
 *   3. XERO_REFRESH_TOKEN env var (initial seed only)
 */
export async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.XERO_CLIENT_ID
  const clientSecret = process.env.XERO_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.warn('[xero] Missing XERO_CLIENT_ID or XERO_CLIENT_SECRET')
    return null
  }

  if (cachedAccessToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedAccessToken
  }

  let refreshToken: string | null = process.env.XERO_REFRESH_TOKEN || null

  if (process.env.POSTGRES_URL) {
    try {
      const { sql } = await import('@vercel/postgres')
      const result = await sql`
        SELECT access_token, refresh_token, expires_at
        FROM xero_tokens
        WHERE key = ${XERO_TOKEN_KEY}
      `
      if (result.rows.length > 0) {
        const row = result.rows[0]
        refreshToken = row.refresh_token
        const dbExpiry = new Date(row.expires_at).getTime()
        if (Date.now() < dbExpiry - 60_000) {
          cachedAccessToken = row.access_token
          tokenExpiresAt = dbExpiry
          return cachedAccessToken
        }
      }
    } catch {
      // Fall through to token refresh
    }
  }

  if (!refreshToken) {
    console.warn('[xero] No refresh token available')
    return null
  }

  return refreshAccessToken(clientId, clientSecret, refreshToken)
}

async function refreshAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<string | null> {
  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const res = await fetch(XERO_TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    if (!res.ok) {
      console.error('[xero] Token refresh failed:', res.status)
      return null
    }

    const data = await res.json() as {
      access_token: string
      refresh_token: string
      expires_in: number
    }

    cachedAccessToken = data.access_token
    tokenExpiresAt = Date.now() + data.expires_in * 1000

    if (process.env.POSTGRES_URL) {
      try {
        const { sql } = await import('@vercel/postgres')
        await sql`
          INSERT INTO xero_tokens (key, access_token, refresh_token, tenant_id, expires_at, updated_at)
          VALUES (
            ${XERO_TOKEN_KEY},
            ${data.access_token},
            ${data.refresh_token},
            ${process.env.XERO_TENANT_ID || ''},
            ${new Date(tokenExpiresAt).toISOString()},
            NOW()
          )
          ON CONFLICT (key) DO UPDATE SET
            access_token = EXCLUDED.access_token,
            refresh_token = EXCLUDED.refresh_token,
            expires_at   = EXCLUDED.expires_at,
            updated_at   = NOW()
        `
      } catch (err) {
        console.error('[xero] Failed to persist tokens:', err instanceof Error ? err.message : 'unknown')
      }
    }

    return cachedAccessToken
  } catch (err) {
    console.error('[xero] Token refresh error:', err instanceof Error ? err.message : 'unknown')
    return null
  }
}

// =============================================
// INVOICE OPERATIONS
// =============================================

export async function getInvoice(
  invoiceId: string,
  tenantId?: string
): Promise<XeroInvoice | null> {
  const accessToken = await getAccessToken()
  if (!accessToken) return null

  const tid = tenantId || process.env.XERO_TENANT_ID
  if (!tid) {
    console.warn('[xero] XERO_TENANT_ID not set')
    return null
  }

  try {
    const res = await fetch(`${XERO_API_BASE}/Invoices/${invoiceId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Xero-Tenant-Id': tid,
        Accept: 'application/json',
      },
    })

    if (!res.ok) {
      console.error('[xero] getInvoice failed:', res.status)
      return null
    }

    const data = await res.json() as { Invoices?: XeroInvoice[] }
    return data.Invoices?.[0] ?? null
  } catch (err) {
    console.error('[xero] getInvoice error:', err instanceof Error ? err.message : 'unknown')
    return null
  }
}

export async function createContact(
  name: string,
  email: string,
  tenantId?: string
): Promise<string | null> {
  const accessToken = await getAccessToken()
  if (!accessToken) return null

  const tid = tenantId || process.env.XERO_TENANT_ID
  if (!tid) return null

  try {
    const res = await fetch(`${XERO_API_BASE}/Contacts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Xero-Tenant-Id': tid,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ Contacts: [{ Name: name, EmailAddress: email }] }),
    })

    if (!res.ok) {
      console.error('[xero] createContact failed:', res.status)
      return null
    }

    const data = await res.json() as { Contacts?: Array<{ ContactID: string }> }
    return data.Contacts?.[0]?.ContactID ?? null
  } catch (err) {
    console.error('[xero] createContact error:', err instanceof Error ? err.message : 'unknown')
    return null
  }
}
