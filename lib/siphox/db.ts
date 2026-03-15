// SiPhox Health Database Operations
// Data access layer for siphox_customers, siphox_kit_orders, siphox_reports tables.
// Follows lib/portal-db.ts pattern: sql tagged templates, typed row interfaces, error wrapping.

import { sql } from '@vercel/postgres'

// ============================================================
// ROW INTERFACES
// ============================================================

export interface SiphoxCustomerRow {
  id: string
  phone_e164: string
  siphox_customer_id: string
  external_id: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  created_at: Date
  updated_at: Date
}

export interface SiphoxKitOrderRow {
  id: string
  siphox_customer_id: string
  siphox_order_id: string
  kit_type: string
  quantity: number
  status: string
  tracking_number: string | null
  stripe_subscription_id: string | null
  is_test_order: boolean
  created_at: Date
  updated_at: Date
}

export interface SiphoxReportRow {
  id: string
  siphox_customer_id: string
  siphox_report_id: string
  report_data: unknown
  suggestions: unknown
  report_status: string | null
  fetched_at: Date
  created_at: Date
}

// ============================================================
// DATABASE ERROR HANDLING
// ============================================================

export class SiphoxDatabaseError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message)
    this.name = 'SiphoxDatabaseError'
  }
}

// ============================================================
// CUSTOMER OPERATIONS
// ============================================================

/**
 * Insert or update a SiPhox customer mapping.
 * Uses INSERT ... ON CONFLICT(phone_e164) DO UPDATE for upsert semantics.
 * external_id is set to phoneE164 for cross-reference.
 */
export async function upsertSiphoxCustomer(
  phoneE164: string,
  siphoxCustomerId: string,
  firstName?: string,
  lastName?: string,
  email?: string
): Promise<void> {
  try {
    await sql`
      INSERT INTO siphox_customers (phone_e164, siphox_customer_id, external_id, first_name, last_name, email)
      VALUES (${phoneE164}, ${siphoxCustomerId}, ${phoneE164}, ${firstName || null}, ${lastName || null}, ${email || null})
      ON CONFLICT (phone_e164) DO UPDATE SET
        siphox_customer_id = EXCLUDED.siphox_customer_id,
        first_name = COALESCE(EXCLUDED.first_name, siphox_customers.first_name),
        last_name = COALESCE(EXCLUDED.last_name, siphox_customers.last_name),
        email = COALESCE(EXCLUDED.email, siphox_customers.email),
        updated_at = NOW()
    `
  } catch (error) {
    throw new SiphoxDatabaseError('Failed to upsert SiPhox customer', error)
  }
}

/**
 * Look up a SiPhox customer by E.164 phone number.
 * Returns the matching row or null if not found.
 */
export async function getSiphoxCustomerByPhone(
  phoneE164: string
): Promise<SiphoxCustomerRow | null> {
  try {
    const result = await sql`
      SELECT id, phone_e164, siphox_customer_id, external_id, first_name, last_name, email,
             created_at, updated_at
      FROM siphox_customers
      WHERE phone_e164 = ${phoneE164}
    `
    if (result.rows.length === 0) return null
    return result.rows[0] as SiphoxCustomerRow
  } catch (error) {
    throw new SiphoxDatabaseError('Failed to get SiPhox customer by phone', error)
  }
}

/**
 * Look up a SiPhox customer by their SiPhox customer ID.
 * Returns the matching row or null if not found.
 */
export async function getSiphoxCustomerBySiphoxId(
  siphoxCustomerId: string
): Promise<SiphoxCustomerRow | null> {
  try {
    const result = await sql`
      SELECT id, phone_e164, siphox_customer_id, external_id, first_name, last_name, email,
             created_at, updated_at
      FROM siphox_customers
      WHERE siphox_customer_id = ${siphoxCustomerId}
    `
    if (result.rows.length === 0) return null
    return result.rows[0] as SiphoxCustomerRow
  } catch (error) {
    throw new SiphoxDatabaseError('Failed to get SiPhox customer by SiPhox ID', error)
  }
}

// ============================================================
// KIT ORDER OPERATIONS
// ============================================================

/**
 * Insert a new kit order record.
 * Returns the inserted row.
 */
export async function insertKitOrder(
  siphoxCustomerId: string,
  siphoxOrderId: string,
  kitType: string,
  opts?: {
    quantity?: number
    stripeSubscriptionId?: string
    isTestOrder?: boolean
  }
): Promise<SiphoxKitOrderRow> {
  const quantity = opts?.quantity ?? 1
  const stripeSubscriptionId = opts?.stripeSubscriptionId ?? null
  const isTestOrder = opts?.isTestOrder ?? false

  try {
    const result = await sql`
      INSERT INTO siphox_kit_orders (siphox_customer_id, siphox_order_id, kit_type, quantity, stripe_subscription_id, is_test_order)
      VALUES (${siphoxCustomerId}, ${siphoxOrderId}, ${kitType}, ${quantity}, ${stripeSubscriptionId}, ${isTestOrder})
      RETURNING *
    `
    return result.rows[0] as SiphoxKitOrderRow
  } catch (error) {
    throw new SiphoxDatabaseError('Failed to insert kit order', error)
  }
}

/**
 * Get all kit orders for a customer, newest first.
 */
export async function getKitOrdersByCustomer(
  siphoxCustomerId: string
): Promise<SiphoxKitOrderRow[]> {
  try {
    const result = await sql`
      SELECT id, siphox_customer_id, siphox_order_id, kit_type, quantity, status,
             tracking_number, stripe_subscription_id, is_test_order, created_at, updated_at
      FROM siphox_kit_orders
      WHERE siphox_customer_id = ${siphoxCustomerId}
      ORDER BY created_at DESC
    `
    return result.rows as SiphoxKitOrderRow[]
  } catch (error) {
    throw new SiphoxDatabaseError('Failed to get kit orders by customer', error)
  }
}

/**
 * Update kit order status and optionally tracking number.
 * Sets updated_at to NOW().
 */
export async function updateKitOrderStatus(
  siphoxOrderId: string,
  status: string,
  trackingNumber?: string
): Promise<void> {
  try {
    await sql`
      UPDATE siphox_kit_orders
      SET status = ${status},
          tracking_number = COALESCE(${trackingNumber || null}, tracking_number),
          updated_at = NOW()
      WHERE siphox_order_id = ${siphoxOrderId}
    `
  } catch (error) {
    throw new SiphoxDatabaseError('Failed to update kit order status', error)
  }
}

// ============================================================
// REPORT OPERATIONS (immutable -- insert only, no updates)
// ============================================================

/**
 * Insert a new biomarker report.
 * Reports are immutable -- there is no update function by design.
 * reportData and suggestions are stored as JSONB.
 * Returns the inserted row.
 */
export async function insertReport(
  siphoxCustomerId: string,
  siphoxReportId: string,
  reportData: unknown,
  suggestions?: unknown,
  reportStatus?: string
): Promise<SiphoxReportRow> {
  try {
    const result = await sql`
      INSERT INTO siphox_reports (siphox_customer_id, siphox_report_id, report_data, suggestions, report_status)
      VALUES (${siphoxCustomerId}, ${siphoxReportId}, ${JSON.stringify(reportData)}, ${suggestions ? JSON.stringify(suggestions) : null}, ${reportStatus || null})
      RETURNING *
    `
    return result.rows[0] as SiphoxReportRow
  } catch (error) {
    throw new SiphoxDatabaseError('Failed to insert report', error)
  }
}

/**
 * Get all reports for a customer, newest first (by fetched_at).
 */
export async function getReportsByCustomer(
  siphoxCustomerId: string
): Promise<SiphoxReportRow[]> {
  try {
    const result = await sql`
      SELECT id, siphox_customer_id, siphox_report_id, report_data, suggestions,
             report_status, fetched_at, created_at
      FROM siphox_reports
      WHERE siphox_customer_id = ${siphoxCustomerId}
      ORDER BY fetched_at DESC
    `
    return result.rows as SiphoxReportRow[]
  } catch (error) {
    throw new SiphoxDatabaseError('Failed to get reports by customer', error)
  }
}

/**
 * Get a single report by its SiPhox report ID.
 * Returns the matching row or null if not found.
 */
export async function getReportById(
  siphoxReportId: string
): Promise<SiphoxReportRow | null> {
  try {
    const result = await sql`
      SELECT id, siphox_customer_id, siphox_report_id, report_data, suggestions,
             report_status, fetched_at, created_at
      FROM siphox_reports
      WHERE siphox_report_id = ${siphoxReportId}
    `
    if (result.rows.length === 0) return null
    return result.rows[0] as SiphoxReportRow
  } catch (error) {
    throw new SiphoxDatabaseError('Failed to get report by ID', error)
  }
}
