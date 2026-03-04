// LMN Generator - Creates PDF documents and database records

import { renderToBuffer } from '@react-pdf/renderer'
import { LmnDocument } from './lmn-template'
import {
  type LmnData,
  type LmnItem,
  type LmnRecord,
  type CreateLmnInput,
  LMN_ATTESTATION_TEXT,
  LMN_PROVIDER_REFERENCE,
} from './lmn-types'
import { filterLmnEligibleItems, calculateLmnEligibleTotal } from './lmn-eligibility'

/**
 * Generate a unique LMN number
 * Format: LMN-YYYYMMDD-XXXXX (e.g., LMN-20260129-A3B7C)
 */
export function generateLmnNumber(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `LMN-${dateStr}-${randomPart}`
}

/**
 * Create LMN data from order information
 */
export function createLmnData(input: CreateLmnInput): LmnData {
  const eligibleItems = filterLmnEligibleItems(input.items)
  const eligibleTotal = calculateLmnEligibleTotal(eligibleItems)

  return {
    lmnNumber: generateLmnNumber(),
    orderNumber: input.orderNumber,
    customerEmail: input.customerEmail,
    customerName: input.customerName || null,
    items: eligibleItems,
    eligibleTotal,
    currency: input.currency || 'USD',
    issueDate: new Date(),
    attestationText: LMN_ATTESTATION_TEXT,
    providerReference: LMN_PROVIDER_REFERENCE,
  }
}

/**
 * Generate PDF buffer from LMN data
 */
export async function generateLmnPdf(data: LmnData): Promise<Buffer> {
  const pdfBuffer = await renderToBuffer(<LmnDocument data={data} />)
  return Buffer.from(pdfBuffer)
}

/**
 * Store LMN record in database
 */
export async function storeLmnRecord(
  data: LmnData,
  orderId?: string
): Promise<LmnRecord | null> {
  if (!process.env.POSTGRES_URL) {
    console.warn('POSTGRES_URL not configured, skipping LMN storage')
    return null
  }

  try {
    const { sql } = await import('@vercel/postgres')

    const result = await sql`
      INSERT INTO lmn_records (
        lmn_number,
        order_id,
        order_number,
        customer_email,
        customer_name,
        items,
        eligible_total,
        currency,
        issue_date,
        attestation_text,
        provider_reference
      ) VALUES (
        ${data.lmnNumber},
        ${orderId || null},
        ${data.orderNumber},
        ${data.customerEmail},
        ${data.customerName},
        ${JSON.stringify(data.items)},
        ${data.eligibleTotal},
        ${data.currency},
        ${data.issueDate.toISOString()},
        ${data.attestationText},
        ${data.providerReference}
      )
      RETURNING *
    `

    if (result.rows.length > 0) {
      console.log('LMN record stored:', { lmnNumber: data.lmnNumber })
      return result.rows[0] as LmnRecord
    }
    return null
  } catch (error) {
    console.error('Failed to store LMN record:', error)
    throw error
  }
}

/**
 * Get LMN record by LMN number
 */
export async function getLmnByNumber(lmnNumber: string): Promise<LmnRecord | null> {
  if (!process.env.POSTGRES_URL) {
    return null
  }

  try {
    const { sql } = await import('@vercel/postgres')
    const result = await sql`
      SELECT * FROM lmn_records WHERE lmn_number = ${lmnNumber}
    `
    return result.rows.length > 0 ? (result.rows[0] as LmnRecord) : null
  } catch (error) {
    console.error('Failed to get LMN by number:', error)
    return null
  }
}

/**
 * Get LMN record by order number
 */
export async function getLmnByOrderNumber(orderNumber: string): Promise<LmnRecord | null> {
  if (!process.env.POSTGRES_URL) {
    return null
  }

  try {
    const { sql } = await import('@vercel/postgres')
    const result = await sql`
      SELECT * FROM lmn_records WHERE order_number = ${orderNumber}
    `
    return result.rows.length > 0 ? (result.rows[0] as LmnRecord) : null
  } catch (error) {
    console.error('Failed to get LMN by order number:', error)
    return null
  }
}

/**
 * Get all LMN records for a customer by email
 */
export async function getLmnsByCustomerEmail(email: string): Promise<LmnRecord[]> {
  if (!process.env.POSTGRES_URL) {
    return []
  }

  try {
    const { sql } = await import('@vercel/postgres')
    const result = await sql`
      SELECT * FROM lmn_records 
      WHERE lower(customer_email) = lower(${email})
      ORDER BY issue_date DESC
    `
    return result.rows as LmnRecord[]
  } catch (error) {
    console.error('Failed to get LMNs by email:', error)
    return []
  }
}

/**
 * Full LMN generation workflow
 * 1. Create LMN data from order
 * 2. Generate PDF
 * 3. Store record in database
 * 4. Return data and PDF buffer
 */
export async function generateAndStoreLmn(
  input: CreateLmnInput,
  orderId?: string
): Promise<{ data: LmnData; pdfBuffer: Buffer; record: LmnRecord | null }> {
  // Create LMN data
  const data = createLmnData(input)

  // Generate PDF
  const pdfBuffer = await generateLmnPdf(data)

  // Store in database
  const record = await storeLmnRecord(data, orderId)

  console.log('LMN generated:', {
    lmnNumber: data.lmnNumber,
    orderNumber: data.orderNumber,
    eligibleItems: data.items.length,
    eligibleTotal: data.eligibleTotal,
  })

  return { data, pdfBuffer, record }
}

/**
 * Regenerate PDF for an existing LMN record
 */
export async function regenerateLmnPdf(lmnNumber: string): Promise<Buffer | null> {
  const record = await getLmnByNumber(lmnNumber)
  if (!record) {
    console.error('LMN record not found:', lmnNumber)
    return null
  }

  const data: LmnData = {
    lmnNumber: record.lmn_number,
    orderNumber: record.order_number,
    customerEmail: record.customer_email,
    customerName: record.customer_name,
    items: record.items as LmnItem[],
    eligibleTotal: Number(record.eligible_total),
    currency: record.currency,
    issueDate: new Date(record.issue_date),
    attestationText: record.attestation_text || LMN_ATTESTATION_TEXT,
    providerReference: record.provider_reference || LMN_PROVIDER_REFERENCE,
  }

  return generateLmnPdf(data)
}
