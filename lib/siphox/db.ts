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
  last_notified_report_id: string | null
  results_notified_at: Date | null
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
  // Fulfillment columns (migration 021)
  fulfillment_status: string
  retry_count: number
  last_error: string | null
  stripe_checkout_session_id: string | null
  customer_email: string | null
  plan_tier: string | null
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
  email?: string,
  ehrPatientId?: string,
): Promise<void> {
  try {
    await sql`
      INSERT INTO siphox_customers (phone_e164, siphox_customer_id, external_id, first_name, last_name, email, ehr_patient_id)
      VALUES (${phoneE164}, ${siphoxCustomerId}, ${phoneE164}, ${firstName || null}, ${lastName || null}, ${email || null}, ${ehrPatientId || null})
      ON CONFLICT (phone_e164) DO UPDATE SET
        siphox_customer_id = EXCLUDED.siphox_customer_id,
        first_name = COALESCE(EXCLUDED.first_name, siphox_customers.first_name),
        last_name = COALESCE(EXCLUDED.last_name, siphox_customers.last_name),
        email = COALESCE(EXCLUDED.email, siphox_customers.email),
        ehr_patient_id = COALESCE(EXCLUDED.ehr_patient_id, siphox_customers.ehr_patient_id),
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
 * Look up a SiPhox customer by email address.
 * Returns the matching row or null if not found.
 */
export async function getSiphoxCustomerByEmail(
  email: string
): Promise<SiphoxCustomerRow | null> {
  try {
    const result = await sql`
      SELECT id, phone_e164, siphox_customer_id, external_id, first_name, last_name, email,
             created_at, updated_at
      FROM siphox_customers
      WHERE LOWER(email) = ${email.toLowerCase()}
    `
    if (result.rows.length === 0) return null
    return result.rows[0] as SiphoxCustomerRow
  } catch (error) {
    throw new SiphoxDatabaseError('Failed to get SiPhox customer by email', error)
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
      SELECT *
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

/**
 * Get all non-terminal kit orders that have a real SiPhox order ID.
 * Used by the siphox-status-sync cron to poll for status updates.
 */
export async function getActiveKitOrders(limit = 50) {
  try {
    const { rows } = await sql`
      SELECT id, siphox_order_id, siphox_customer_id, status, tracking_number
      FROM siphox_kit_orders
      WHERE siphox_order_id IS NOT NULL
        AND siphox_order_id != 'pending'
        AND status NOT IN ('results_ready', 'failed')
        AND fulfillment_status NOT IN ('failed', 'needs_credits', 'pending_intake')
      ORDER BY updated_at ASC
      LIMIT ${limit}
    `
    return rows as Array<{
      id: string
      siphox_order_id: string
      siphox_customer_id: string
      status: string
      tracking_number: string | null
    }>
  } catch (error) {
    throw new SiphoxDatabaseError('Failed to get active kit orders', error)
  }
}

// ============================================================
// FULFILLMENT OPERATIONS
// ============================================================

export type FulfillmentStatus =
  | 'pending_intake'
  | 'pending_fulfillment'
  | 'processing'
  | 'fulfilled'
  | 'failed'
  | 'needs_credits'

/**
 * Insert a kit order row with fulfillment columns populated.
 * Used by triggerSiphoxFulfillment when a checkout triggers a kit order.
 * siphoxCustomerId defaults to 'pending' if customer not yet created.
 * siphoxOrderId defaults to 'pending-{checkoutSessionId}' if order not yet placed.
 */
export async function insertFulfillmentOrder(params: {
  siphoxCustomerId?: string
  siphoxOrderId?: string
  kitType: string
  stripeCheckoutSessionId: string
  customerEmail: string
  planTier: string
  fulfillmentStatus: FulfillmentStatus
  stripeSubscriptionId?: string
  isTestOrder?: boolean
}): Promise<SiphoxKitOrderRow> {
  const siphoxCustomerId = params.siphoxCustomerId || 'pending'
  const siphoxOrderId = params.siphoxOrderId || `pending-${params.stripeCheckoutSessionId}`
  const stripeSubscriptionId = params.stripeSubscriptionId ?? null
  const isTestOrder = params.isTestOrder ?? false

  try {
    const result = await sql`
      INSERT INTO siphox_kit_orders (
        siphox_customer_id, siphox_order_id, kit_type, quantity,
        fulfillment_status, stripe_checkout_session_id, customer_email, plan_tier,
        stripe_subscription_id, is_test_order
      )
      VALUES (
        ${siphoxCustomerId}, ${siphoxOrderId}, ${params.kitType}, 1,
        ${params.fulfillmentStatus}, ${params.stripeCheckoutSessionId}, ${params.customerEmail}, ${params.planTier},
        ${stripeSubscriptionId}, ${isTestOrder}
      )
      RETURNING *
    `
    return result.rows[0] as SiphoxKitOrderRow
  } catch (error) {
    throw new SiphoxDatabaseError('Failed to insert fulfillment order', error)
  }
}

/**
 * Look up a kit order by Stripe checkout session ID.
 * Used for idempotency checks (prevent duplicate orders for same checkout).
 */
export async function getOrderByCheckoutSession(
  stripeCheckoutSessionId: string
): Promise<SiphoxKitOrderRow | null> {
  try {
    const result = await sql`
      SELECT *
      FROM siphox_kit_orders
      WHERE stripe_checkout_session_id = ${stripeCheckoutSessionId}
      LIMIT 1
    `
    if (result.rows.length === 0) return null
    return result.rows[0] as SiphoxKitOrderRow
  } catch (error) {
    throw new SiphoxDatabaseError('Failed to get order by checkout session', error)
  }
}

/**
 * Get all orders with pending_fulfillment status and retry_count < 3.
 * Used by the cron job to retry failed SiPhox API calls.
 */
export async function getPendingFulfillmentOrders(): Promise<SiphoxKitOrderRow[]> {
  try {
    const result = await sql`
      SELECT *
      FROM siphox_kit_orders
      WHERE fulfillment_status = 'pending_fulfillment'
        AND retry_count < 3
      ORDER BY created_at ASC
    `
    return result.rows as SiphoxKitOrderRow[]
  } catch (error) {
    throw new SiphoxDatabaseError('Failed to get pending fulfillment orders', error)
  }
}

/**
 * Get all orders with pending_intake status.
 * Used by the cron job to check if intake data is now available.
 */
export async function getDeferredIntakeOrders(): Promise<SiphoxKitOrderRow[]> {
  try {
    const result = await sql`
      SELECT *
      FROM siphox_kit_orders
      WHERE fulfillment_status = 'pending_intake'
      ORDER BY created_at ASC
    `
    return result.rows as SiphoxKitOrderRow[]
  } catch (error) {
    throw new SiphoxDatabaseError('Failed to get deferred intake orders', error)
  }
}

/**
 * Update fulfillment status and optionally siphox_customer_id, siphox_order_id, last_error.
 * Sets updated_at = NOW().
 */
export async function updateFulfillmentStatus(
  kitOrderId: string,
  status: FulfillmentStatus,
  opts?: {
    siphoxCustomerId?: string
    siphoxOrderId?: string
    lastError?: string
  }
): Promise<void> {
  try {
    await sql`
      UPDATE siphox_kit_orders
      SET fulfillment_status = ${status},
          siphox_customer_id = COALESCE(${opts?.siphoxCustomerId || null}, siphox_customer_id),
          siphox_order_id = COALESCE(${opts?.siphoxOrderId || null}, siphox_order_id),
          last_error = COALESCE(${opts?.lastError || null}, last_error),
          updated_at = NOW()
      WHERE id = ${kitOrderId}
    `
  } catch (error) {
    throw new SiphoxDatabaseError('Failed to update fulfillment status', error)
  }
}

/**
 * Increment retry count and record the last error.
 * Sets updated_at = NOW().
 */
export async function incrementRetryCount(
  kitOrderId: string,
  lastError: string
): Promise<void> {
  try {
    await sql`
      UPDATE siphox_kit_orders
      SET retry_count = retry_count + 1,
          last_error = ${lastError},
          updated_at = NOW()
      WHERE id = ${kitOrderId}
    `
  } catch (error) {
    throw new SiphoxDatabaseError('Failed to increment retry count', error)
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

// ============================================================
// RESULTS NOTIFICATION OPERATIONS
// ============================================================

export interface UnnotifiedCustomer {
  siphox_customer_id: string
  first_name: string | null
  last_name: string | null
  email: string
  ehr_patient_id: string | null
  latest_report_id: string
  report_data: unknown
  suggestions: unknown
}

/**
 * Get customers who have a report that hasn't been notified about yet.
 * Joins siphox_customers with siphox_reports via lateral subquery for latest report.
 * Only returns customers with a non-null email.
 * Batch-limited to prevent runaway email sends.
 */
export async function getCustomersWithUnnotifiedReports(
  limit = 50
): Promise<UnnotifiedCustomer[]> {
  try {
    const result = await sql`
      SELECT
        c.siphox_customer_id,
        c.first_name,
        c.last_name,
        c.email,
        c.ehr_patient_id,
        r.siphox_report_id AS latest_report_id,
        r.report_data,
        r.suggestions
      FROM siphox_customers c
      INNER JOIN LATERAL (
        SELECT siphox_report_id, report_data, suggestions
        FROM siphox_reports
        WHERE siphox_customer_id = c.siphox_customer_id
        ORDER BY fetched_at DESC
        LIMIT 1
      ) r ON true
      WHERE c.email IS NOT NULL
        AND (c.last_notified_report_id IS NULL OR c.last_notified_report_id != r.siphox_report_id)
      LIMIT ${limit}
    `
    return result.rows as UnnotifiedCustomer[]
  } catch (error) {
    throw new SiphoxDatabaseError('Failed to get customers with unnotified reports', error)
  }
}

/**
 * Mark a customer as notified about a specific report.
 * Updates last_notified_report_id and results_notified_at.
 */
export async function markResultsNotified(
  siphoxCustomerId: string,
  reportId: string
): Promise<void> {
  try {
    await sql`
      UPDATE siphox_customers
      SET last_notified_report_id = ${reportId},
          results_notified_at = NOW(),
          updated_at = NOW()
      WHERE siphox_customer_id = ${siphoxCustomerId}
    `
  } catch (error) {
    throw new SiphoxDatabaseError('Failed to mark results notified', error)
  }
}
