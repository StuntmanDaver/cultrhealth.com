// SiPhox Health API Client
// Follows lib/asher-med-api.ts pattern with Bearer auth and Zod validation
// HIPAA: Never log response bodies or biomarker values

import { z } from 'zod'
import { SiphoxApiError } from './errors'
import {
  SiphoxCustomerSchema,
  SiphoxOrderSchema,
  SiphoxCreditsSchema,
  SiphoxKitValidationSchema,
  SiphoxReportSchema,
  SiphoxBiomarkerResultSchema,
} from './schemas'
import type {
  SiphoxCustomer,
  SiphoxOrder,
  SiphoxCredits,
  SiphoxKitValidation,
  SiphoxReport,
  SiphoxBiomarkerResult,
  CreateSiphoxCustomerRequest,
  CreateSiphoxOrderRequest,
} from './types'

// ============================================================
// CONFIGURATION
// ============================================================

const LOW_CREDIT_THRESHOLD = 5

function getSiphoxApiUrl(): string {
  return process.env.SIPHOX_API_URL || 'https://connect.siphoxhealth.com/api/v1'
}

/**
 * Check if SiPhox API is configured (API key is set)
 */
export function isSiphoxConfigured(): boolean {
  return !!process.env.SIPHOX_API_KEY
}

// ============================================================
// GENERIC REQUEST WRAPPER
// ============================================================

async function siphoxRequest<T>(
  endpoint: string,
  schema: z.ZodType<T>,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    body?: unknown
    params?: Record<string, string | number | undefined>
  } = {}
): Promise<T> {
  const apiKey = process.env.SIPHOX_API_KEY

  if (!apiKey) {
    throw new SiphoxApiError('SIPHOX_API_KEY is not configured')
  }

  const baseUrl = getSiphoxApiUrl()
  let url = `${baseUrl}${endpoint}`

  // Add query parameters if provided
  if (options.params) {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined) {
        searchParams.append(key, String(value))
      }
    }
    const queryString = searchParams.toString()
    if (queryString) {
      url += `?${queryString}`
    }
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }

  const fetchOptions: RequestInit = {
    method: options.method || 'GET',
    headers,
  }

  if (options.body && (options.method === 'POST' || options.method === 'PUT')) {
    fetchOptions.body = JSON.stringify(options.body)
  }

  const response = await fetch(url, fetchOptions)

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new SiphoxApiError(
      errorData?.message || `SiPhox API error: ${response.status}`,
      response.status,
      errorData
    )
  }

  const data = await response.json()

  // Zod validation gate -- NEVER skip this
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    console.error('SiPhox response validation failed:', parsed.error.issues)
    throw new SiphoxApiError(
      `Response validation failed: ${parsed.error.issues.map(i => i.message).join(', ')}`,
      response.status,
      data
    )
  }

  return parsed.data
}

// ============================================================
// CUSTOMER ENDPOINTS
// ============================================================

/**
 * Create a new SiPhox customer
 * POST /customer
 */
export async function createCustomer(
  req: CreateSiphoxCustomerRequest
): Promise<SiphoxCustomer> {
  return siphoxRequest('/customer', SiphoxCustomerSchema, {
    method: 'POST',
    body: req,
  })
}

/**
 * Look up a SiPhox customer by external_id
 * GET /customers with external_id query param
 * Returns null if not found (catches 404)
 */
export async function getCustomerByExternalId(
  externalId: string
): Promise<SiphoxCustomer | null> {
  try {
    return await siphoxRequest('/customers', SiphoxCustomerSchema, {
      params: { external_id: externalId },
    })
  } catch (error) {
    if (error instanceof SiphoxApiError && error.statusCode === 404) {
      return null
    }
    throw error
  }
}

// ============================================================
// ORDER ENDPOINTS
// ============================================================

/**
 * Create a new SiPhox kit order
 * POST /orders
 */
export async function createOrder(
  req: CreateSiphoxOrderRequest
): Promise<SiphoxOrder> {
  return siphoxRequest('/orders', SiphoxOrderSchema, {
    method: 'POST',
    body: req,
  })
}

/**
 * Get order details by ID
 * GET /orders/:id
 */
export async function getOrder(orderId: string): Promise<SiphoxOrder> {
  return siphoxRequest(`/orders/${orderId}`, SiphoxOrderSchema)
}

// ============================================================
// KIT ENDPOINTS
// ============================================================

/**
 * Validate a kit ID
 * GET /kits/:kitID/validate
 */
export async function validateKit(kitId: string): Promise<SiphoxKitValidation> {
  return siphoxRequest(`/kits/${kitId}/validate`, SiphoxKitValidationSchema)
}

// ============================================================
// REPORT ENDPOINTS
// ============================================================

/**
 * Get all reports for a customer
 * GET /customers/:id/reports
 */
export async function getReports(customerId: string): Promise<SiphoxReport[]> {
  return siphoxRequest(
    `/customers/${customerId}/reports`,
    z.array(SiphoxReportSchema)
  )
}

/**
 * Get a specific report for a customer
 * GET /customers/:id/reports/:reportID
 */
export async function getReport(
  customerId: string,
  reportId: string
): Promise<SiphoxReport> {
  return siphoxRequest(
    `/customers/${customerId}/reports/${reportId}`,
    SiphoxReportSchema
  )
}

// ============================================================
// BIOMARKER ENDPOINTS
// ============================================================

/**
 * Get available biomarkers
 * GET /biomarkers
 */
export async function getBiomarkers(): Promise<SiphoxBiomarkerResult[]> {
  return siphoxRequest('/biomarkers', z.array(SiphoxBiomarkerResultSchema))
}

// ============================================================
// CREDIT ENDPOINTS
// ============================================================

/**
 * Check SiPhox credit balance
 * Returns balance and whether it's below the low threshold
 * Triggers admin email alert (non-blocking) when balance is low
 */
export async function checkCreditBalance(): Promise<{
  balance: number
  isLow: boolean
}> {
  const credits = await siphoxRequest('/credits', SiphoxCreditsSchema)
  const isLow = credits.balance < LOW_CREDIT_THRESHOLD

  if (isLow) {
    // Non-blocking: send alert but don't fail the credit check
    try {
      const { sendLowCreditAlert } = await import('@/lib/resend')
      await sendLowCreditAlert(credits.balance, LOW_CREDIT_THRESHOLD)
    } catch (emailError) {
      console.error('Failed to send low credit alert email')
      // Don't throw -- credit check result is more important than email
    }
  }

  return { balance: credits.balance, isLow }
}
