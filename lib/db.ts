import { sql } from '@vercel/postgres'
import type { PaymentProvider } from '@/lib/payments/payment-types'
import { OWNER_EMAILS_PG_ARRAY } from '@/lib/config/owner-emails'
import { COMMISSION_CONFIG } from '@/lib/config/affiliate'

// ===========================================
// TYPE DEFINITIONS
// ===========================================

export interface WaitlistEntry {
  id: string
  name: string
  email: string
  phone: string
  social_handle?: string
  treatment_reason?: string
  source?: string
  coupon_code?: string
  status: string
  created_at: Date
  updated_at: Date
}

export interface CreateWaitlistInput {
  name: string
  email: string
  phone: string
  social_handle?: string
  treatment_reason?: string
  source?: string
  coupon_code?: string
}

export interface MembershipEntry {
  id: string
  stripe_customer_id: string
  stripe_subscription_id: string
  plan_tier: string
  subscription_status: string
  asher_patient_id?: number | string
  cultr_patient_number?: string | null
  email?: string | null
  ehr_patient_id?: string | null
  ehr_provider?: string | null
  ehr_sync_status?: string | null
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  payment_provider?: PaymentProvider | string | null
  provider_customer_id?: string | null
  provider_subscription_id?: string | null
  lab_preference?: string | null
  lab_fee_cents?: number | null
  siphox_status?: string | null
  siphox_customer_id?: string | null
  siphox_order_id?: string | null
  created_at: Date
  updated_at: Date
  cancelled_at?: Date
  cancellation_reason?: string
}

export interface CreateMembershipInput {
  stripe_customer_id: string
  stripe_subscription_id: string
  plan_tier: string
  subscription_status: string
  asher_patient_id?: number | string
  ehr_patient_id?: string
  ehr_provider?: string
  ehr_sync_status?: string
  email?: string
  first_name?: string
  last_name?: string
  phone?: string
  payment_provider?: PaymentProvider
  provider_customer_id?: string
  provider_subscription_id?: string
  cultr_patient_number?: string
  lab_preference?: string
  lab_fee_cents?: number
  siphox_status?: string
  siphox_customer_id?: string
  siphox_order_id?: string
  siphox_kit_type?: string
  siphox_opted_out_at?: Date
  shipping_address?: unknown
  signup_order_id?: string
  initial_charge_transaction_id?: string
  calendly_review_url?: string | null
}

export interface UpdateMembershipInput {
  subscription_status?: string
  plan_tier?: string
  asher_patient_id?: number | string
  cancelled_at?: Date
  cancellation_reason?: string
}

// ===========================================
// DATABASE ERROR HANDLING
// ===========================================

export class DatabaseError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message)
    this.name = 'DatabaseError'
  }
}

// ===========================================
// WAITLIST FUNCTIONS
// ===========================================

export async function createWaitlistEntry(input: CreateWaitlistInput): Promise<{ id: string; isNew: boolean }> {
  const { name, email, phone, social_handle, treatment_reason, source, coupon_code } = input

  try {
    // Ensure table and index exist
    await ensureWaitlistTable()

    // Upsert: insert or update if email already exists
    const result = await sql`
      INSERT INTO waitlist (name, email, phone, social_handle, treatment_reason, source, coupon_code, status, created_at, updated_at)
      VALUES (${name}, ${email.toLowerCase()}, ${phone}, ${social_handle || null}, ${treatment_reason || null}, ${source || null}, ${coupon_code || null}, 'new', NOW(), NOW())
      ON CONFLICT (lower(email))
      DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        social_handle = EXCLUDED.social_handle,
        treatment_reason = EXCLUDED.treatment_reason,
        coupon_code = COALESCE(EXCLUDED.coupon_code, waitlist.coupon_code),
        updated_at = NOW()
      RETURNING id, (xmax = 0) as is_new
    `

    const row = result.rows[0]
    return {
      id: row.id,
      isNew: row.is_new
    }
  } catch (error) {
    console.error('Database error creating waitlist entry:', error)
    throw new DatabaseError('Failed to create waitlist entry', error)
  }
}

let waitlistTableReady = false

async function ensureWaitlistTable() {
  if (waitlistTableReady) return
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS waitlist (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        social_handle TEXT,
        treatment_reason TEXT,
        source TEXT,
        coupon_code VARCHAR(50),
        status TEXT NOT NULL DEFAULT 'new',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `
    await sql`ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50)`
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS waitlist_email_lower_idx ON waitlist (lower(email))
    `
    waitlistTableReady = true
  } catch (error) {
    console.error('Error ensuring waitlist table:', error)
  }
}

export async function getWaitlistEntryByEmail(email: string): Promise<WaitlistEntry | null> {
  try {
    const result = await sql`
      SELECT * FROM waitlist WHERE lower(email) = ${email.toLowerCase()}
    `

    return result.rows[0] as WaitlistEntry | null
  } catch (error) {
    console.error('Database error fetching waitlist entry:', error)
    throw new DatabaseError('Failed to fetch waitlist entry', error)
  }
}

// ===========================================
// MEMBERSHIP FUNCTIONS
// ===========================================

export async function createMembership(input: CreateMembershipInput): Promise<{ id: string }> {
  const {
    stripe_customer_id,
    stripe_subscription_id,
    plan_tier,
    subscription_status,
    asher_patient_id,
    ehr_patient_id,
    ehr_provider,
    ehr_sync_status,
    email,
    first_name,
    last_name,
    phone,
    payment_provider = 'stripe',
    provider_customer_id,
    provider_subscription_id,
    cultr_patient_number,
    lab_preference,
    lab_fee_cents,
    siphox_status,
    siphox_customer_id,
    siphox_order_id,
    siphox_kit_type,
    siphox_opted_out_at,
    shipping_address,
    signup_order_id,
    initial_charge_transaction_id,
    calendly_review_url,
  } = input

  try {
    const result = await sql`
      INSERT INTO memberships (
        stripe_customer_id,
        stripe_subscription_id,
        payment_provider,
        provider_customer_id,
        provider_subscription_id,
        plan_tier,
        subscription_status,
        asher_patient_id,
        ehr_patient_id,
        ehr_provider,
        ehr_sync_status,
        email,
        first_name,
        last_name,
        phone,
        cultr_patient_number,
        lab_preference,
        lab_fee_cents,
        siphox_status,
        siphox_customer_id,
        siphox_order_id,
        siphox_kit_type,
        siphox_opted_out_at,
        shipping_address,
        signup_order_id,
        initial_charge_transaction_id,
        calendly_review_url,
        created_at,
        updated_at
      )
      VALUES (
        ${stripe_customer_id},
        ${stripe_subscription_id},
        ${payment_provider},
        ${provider_customer_id || null},
        ${provider_subscription_id || null},
        ${plan_tier},
        ${subscription_status},
        ${asher_patient_id || null},
        ${ehr_patient_id || null},
        ${ehr_provider || null},
        ${ehr_sync_status || 'pending'},
        ${email || null},
        ${first_name || null},
        ${last_name || null},
        ${phone || null},
        ${cultr_patient_number || null},
        ${lab_preference || 'siphox'},
        ${lab_fee_cents ?? 0},
        ${siphox_status || 'not_started'},
        ${siphox_customer_id || null},
        ${siphox_order_id || null},
        ${siphox_kit_type || null},
        ${siphox_opted_out_at ? siphox_opted_out_at.toISOString() : null},
        ${shipping_address ? JSON.stringify(shipping_address) : null}::jsonb,
        ${signup_order_id || null},
        ${initial_charge_transaction_id || null},
        ${calendly_review_url || null},
        NOW(),
        NOW()
      )
      ON CONFLICT (stripe_subscription_id)
      DO UPDATE SET
        subscription_status = EXCLUDED.subscription_status,
        plan_tier = EXCLUDED.plan_tier,
        payment_provider = EXCLUDED.payment_provider,
        provider_customer_id = COALESCE(EXCLUDED.provider_customer_id, memberships.provider_customer_id),
        provider_subscription_id = COALESCE(EXCLUDED.provider_subscription_id, memberships.provider_subscription_id),
        email = COALESCE(EXCLUDED.email, memberships.email),
        ehr_patient_id = COALESCE(EXCLUDED.ehr_patient_id, memberships.ehr_patient_id),
        ehr_provider = COALESCE(EXCLUDED.ehr_provider, memberships.ehr_provider),
        ehr_sync_status = COALESCE(EXCLUDED.ehr_sync_status, memberships.ehr_sync_status),
        first_name = COALESCE(EXCLUDED.first_name, memberships.first_name),
        last_name = COALESCE(EXCLUDED.last_name, memberships.last_name),
        phone = COALESCE(EXCLUDED.phone, memberships.phone),
        cultr_patient_number = COALESCE(EXCLUDED.cultr_patient_number, memberships.cultr_patient_number),
        lab_preference = COALESCE(EXCLUDED.lab_preference, memberships.lab_preference),
        lab_fee_cents = EXCLUDED.lab_fee_cents,
        siphox_status = COALESCE(EXCLUDED.siphox_status, memberships.siphox_status),
        siphox_customer_id = COALESCE(EXCLUDED.siphox_customer_id, memberships.siphox_customer_id),
        siphox_order_id = COALESCE(EXCLUDED.siphox_order_id, memberships.siphox_order_id),
        siphox_kit_type = COALESCE(EXCLUDED.siphox_kit_type, memberships.siphox_kit_type),
        siphox_opted_out_at = COALESCE(EXCLUDED.siphox_opted_out_at, memberships.siphox_opted_out_at),
        shipping_address = COALESCE(EXCLUDED.shipping_address, memberships.shipping_address),
        signup_order_id = COALESCE(EXCLUDED.signup_order_id, memberships.signup_order_id),
        initial_charge_transaction_id = COALESCE(EXCLUDED.initial_charge_transaction_id, memberships.initial_charge_transaction_id),
        calendly_review_url = COALESCE(EXCLUDED.calendly_review_url, memberships.calendly_review_url),
        updated_at = NOW()
      RETURNING id
    `

    return { id: result.rows[0].id }
  } catch (error) {
    console.error('Database error creating membership:', error)
    throw new DatabaseError('Failed to create membership', error)
  }
}

export async function updateMembershipBySubscriptionId(
  subscriptionId: string,
  input: UpdateMembershipInput
): Promise<boolean> {
  try {
    const hasUpdates =
      input.subscription_status !== undefined ||
      input.plan_tier !== undefined ||
      input.asher_patient_id !== undefined ||
      input.cancelled_at !== undefined ||
      input.cancellation_reason !== undefined

    if (!hasUpdates) {
      return false
    }

    const result = await sql`
      UPDATE memberships
      SET
        subscription_status = CASE
          WHEN ${input.subscription_status !== undefined} THEN ${input.subscription_status ?? null}
          ELSE subscription_status
        END,
        plan_tier = CASE
          WHEN ${input.plan_tier !== undefined} THEN ${input.plan_tier ?? null}
          ELSE plan_tier
        END,
        asher_patient_id = CASE
          WHEN ${input.asher_patient_id !== undefined} THEN ${input.asher_patient_id !== undefined ? String(input.asher_patient_id) : null}
          ELSE asher_patient_id
        END,
        cancelled_at = CASE
          WHEN ${input.cancelled_at !== undefined} THEN ${input.cancelled_at?.toISOString() ?? null}
          ELSE cancelled_at
        END,
        cancellation_reason = CASE
          WHEN ${input.cancellation_reason !== undefined} THEN ${input.cancellation_reason ?? null}
          ELSE cancellation_reason
        END,
        updated_at = NOW()
      WHERE stripe_subscription_id = ${subscriptionId}
    `

    return (result.rowCount ?? 0) > 0
  } catch (error) {
    console.error('Database error updating membership:', error)
    throw new DatabaseError('Failed to update membership', error)
  }
}

export async function getMembershipBySubscriptionId(subscriptionId: string): Promise<MembershipEntry | null> {
  try {
    const result = await sql`
      SELECT * FROM memberships WHERE stripe_subscription_id = ${subscriptionId}
    `

    return result.rows[0] as MembershipEntry | null
  } catch (error) {
    console.error('Database error fetching membership:', error)
    throw new DatabaseError('Failed to fetch membership', error)
  }
}

export async function getMembershipByCustomerId(customerId: string): Promise<MembershipEntry | null> {
  try {
    const result = await sql`
      SELECT * FROM memberships WHERE stripe_customer_id = ${customerId}
      ORDER BY created_at DESC
      LIMIT 1
    `

    return result.rows[0] as MembershipEntry | null
  } catch (error) {
    console.error('Database error fetching membership by customer:', error)
    throw new DatabaseError('Failed to fetch membership', error)
  }
}

export async function getMembershipByEmail(email: string): Promise<MembershipEntry | null> {
  try {
    const result = await sql`
      SELECT * FROM memberships
      WHERE LOWER(email) = LOWER(${email})
      ORDER BY
        CASE
          WHEN subscription_status IN ('active', 'trialing') THEN 0
          ELSE 1
        END,
        created_at DESC
      LIMIT 1
    `

    return result.rows[0] as MembershipEntry | null
  } catch (error) {
    console.error('Database error fetching membership by email:', error)
    throw new DatabaseError('Failed to fetch membership', error)
  }
}

// ===========================================
// STRIPE EVENT TRACKING (Idempotency)
// ===========================================

export async function isStripeEventProcessed(eventId: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT 1 FROM stripe_events WHERE event_id = ${eventId}
    `
    return (result.rowCount ?? 0) > 0
  } catch (error) {
    console.error('Database error checking Stripe event:', error)
    return false // Safety fallback
  }
}

export async function recordStripeEvent(eventId: string, type: string): Promise<void> {
  try {
    await sql`
      INSERT INTO stripe_events (event_id, event_type, processed_at)
      VALUES (${eventId}, ${type}, NOW())
      ON CONFLICT (event_id) DO NOTHING
    `
  } catch (error) {
    console.error('Database error recording Stripe event:', error)
  }
}

// ===========================================
// ORDER / SALES TRACKING
// ===========================================

export interface OrderEntry {
  id: string
  order_number: string
  customer_email: string
  stripe_payment_intent_id?: string
  stripe_customer_id?: string
  asher_patient_id?: number | string
  payment_provider: PaymentProvider
  status: 'pending' | 'paid' | 'shipped' | 'fulfilled' | 'cancelled' | 'refunded'
  total_amount: number
  currency: string
  items: OrderItem[]
  created_at: Date
  updated_at: Date
  fulfilled_at?: Date
  notes?: string
}

export interface OrderItem {
  sku: string
  name: string
  quantity: number
  unit_price: number
  category: string
}

export interface CreateOrderInput {
  order_number: string
  customer_email: string
  stripe_payment_intent_id?: string
  stripe_customer_id?: string
  asher_patient_id?: number | string
  payment_provider?: PaymentProvider
  status: 'pending' | 'paid' | 'shipped' | 'fulfilled' | 'cancelled' | 'refunded'
  total_amount: number
  currency?: string
  items: OrderItem[]
  notes?: string
}

export interface UpdateOrderInput {
  status?: 'pending' | 'paid' | 'fulfilled' | 'cancelled' | 'refunded' | 'shipped'
  asher_patient_id?: number | string
  fulfilled_at?: Date
  shipped_at?: Date
  tracking_carrier?: string
  tracking_number?: string
  tracking_url?: string
  notes?: string
}

export interface TrackingInfo {
  carrier: string
  trackingNumber: string
  trackingUrl?: string
}

export async function createOrder(input: CreateOrderInput): Promise<{ id: string; order_number: string }> {
  const {
    order_number,
    customer_email,
    stripe_payment_intent_id,
    stripe_customer_id,
    asher_patient_id,
    payment_provider = 'stripe',
    status,
    total_amount,
    currency = 'USD',
    items,
    notes,
  } = input

  try {
    const result = await sql`
      INSERT INTO orders (
        order_number,
        customer_email,
        stripe_payment_intent_id,
        stripe_customer_id,
        asher_patient_id,
        payment_provider,
        status,
        total_amount,
        currency,
        items,
        notes,
        created_at,
        updated_at
      )
      VALUES (
        ${order_number},
        ${customer_email.toLowerCase()},
        ${stripe_payment_intent_id || null},
        ${stripe_customer_id || null},
        ${asher_patient_id || null},
        ${payment_provider},
        ${status},
        ${total_amount},
        ${currency},
        ${JSON.stringify(items)},
        ${notes || null},
        NOW(),
        NOW()
      )
      RETURNING id, order_number
    `

    return { id: result.rows[0].id, order_number: result.rows[0].order_number }
  } catch (error) {
    console.error('Database error creating order:', error)
    throw new DatabaseError('Failed to create order', error)
  }
}

export async function updateOrderByOrderNumber(
  orderNumber: string,
  input: UpdateOrderInput
): Promise<boolean> {
  try {
    const result = await sql`
      UPDATE orders
      SET 
        status = COALESCE(${input.status || null}, status),
        asher_patient_id = COALESCE(${input.asher_patient_id || null}, asher_patient_id),
        fulfilled_at = ${input.fulfilled_at?.toISOString() || null},
        notes = COALESCE(${input.notes || null}, notes),
        updated_at = NOW()
      WHERE order_number = ${orderNumber}
    `

    return (result.rowCount ?? 0) > 0
  } catch (error) {
    console.error('Database error updating order:', error)
    throw new DatabaseError('Failed to update order', error)
  }
}

/**
 * Mark an order as shipped with tracking information
 */
export async function markOrderShipped(
  orderNumber: string,
  trackingInfo: TrackingInfo
): Promise<boolean> {
  try {
    const result = await sql`
      UPDATE orders
      SET 
        status = 'shipped',
        notes = CONCAT(
          COALESCE(notes || E'\n', ''),
          'Shipped via ', ${trackingInfo.carrier}, ' - Tracking: ', ${trackingInfo.trackingNumber}
        ),
        updated_at = NOW()
      WHERE order_number = ${orderNumber}
    `

    if ((result.rowCount ?? 0) > 0) {
      console.log('Order marked as shipped:', {
        orderNumber,
        carrier: trackingInfo.carrier,
        trackingNumber: trackingInfo.trackingNumber
      })
    }

    return (result.rowCount ?? 0) > 0
  } catch (error) {
    console.error('Database error marking order shipped:', error)
    throw new DatabaseError('Failed to mark order as shipped', error)
  }
}

/**
 * Mark an order as fulfilled (delivered/completed)
 */
export async function markOrderFulfilled(
  orderNumber: string,
  trackingInfo?: TrackingInfo
): Promise<boolean> {
  try {
    const noteAddition = trackingInfo
      ? `Fulfilled. Carrier: ${trackingInfo.carrier}, Tracking: ${trackingInfo.trackingNumber}`
      : 'Fulfilled.'

    const result = await sql`
      UPDATE orders
      SET 
        status = 'fulfilled',
        fulfilled_at = NOW(),
        notes = CONCAT(
          COALESCE(notes || E'\n', ''),
          ${noteAddition}
        ),
        updated_at = NOW()
      WHERE order_number = ${orderNumber}
    `

    if ((result.rowCount ?? 0) > 0) {
      console.log('Order marked as fulfilled:', { orderNumber })
    }

    return (result.rowCount ?? 0) > 0
  } catch (error) {
    console.error('Database error marking order fulfilled:', error)
    throw new DatabaseError('Failed to mark order as fulfilled', error)
  }
}

/**
 * Get all orders that need to be fulfilled (paid but not shipped/fulfilled)
 */
export async function getPendingFulfillmentOrders(limit = 100): Promise<OrderEntry[]> {
  try {
    const result = await sql`
      SELECT * FROM orders 
      WHERE status = 'paid'
      ORDER BY created_at ASC
      LIMIT ${limit}
    `

    return result.rows.map(row => ({
      ...row,
      items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
    })) as OrderEntry[]
  } catch (error) {
    console.error('Database error fetching pending fulfillment orders:', error)
    throw new DatabaseError('Failed to fetch pending fulfillment orders', error)
  }
}

export async function getOrderByOrderNumber(orderNumber: string): Promise<OrderEntry | null> {
  try {
    const result = await sql`
      SELECT * FROM orders WHERE order_number = ${orderNumber}
    `

    if (!result.rows[0]) return null

    return {
      ...result.rows[0],
      items: typeof result.rows[0].items === 'string'
        ? JSON.parse(result.rows[0].items)
        : result.rows[0].items,
    } as OrderEntry
  } catch (error) {
    console.error('Database error fetching order:', error)
    throw new DatabaseError('Failed to fetch order', error)
  }
}

export async function getOrdersByCustomerEmail(email: string, limit = 50): Promise<OrderEntry[]> {
  try {
    const result = await sql`
      SELECT * FROM orders 
      WHERE customer_email = ${email.toLowerCase()}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `

    return result.rows.map(row => ({
      ...row,
      items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
    })) as OrderEntry[]
  } catch (error) {
    console.error('Database error fetching orders:', error instanceof Error ? error.message : 'unknown')
    throw new DatabaseError('Failed to fetch orders', error)
  }
}

export async function getRecentOrders(limit = 100): Promise<OrderEntry[]> {
  try {
    const result = await sql`
      SELECT * FROM orders 
      ORDER BY created_at DESC
      LIMIT ${limit}
    `

    return result.rows.map(row => ({
      ...row,
      items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
    })) as OrderEntry[]
  } catch (error) {
    console.error('Database error fetching recent orders:', error)
    throw new DatabaseError('Failed to fetch recent orders', error)
  }
}

// ===========================================
// ANALYTICS / STATS
// ===========================================

export interface SalesStats {
  totalOrders: number
  totalRevenue: number
  ordersByStatus: Record<string, number>
  topProducts: { sku: string; name: string; quantity: number; revenue: number }[]
  recentOrders: OrderEntry[]
}

export async function getSalesStats(days = 30): Promise<SalesStats> {
  try {
    // Get total orders and revenue (use make_interval for safe parameterization)
    const totalsResult = await sql`
      SELECT
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue
      FROM orders
      WHERE created_at >= NOW() - make_interval(days => ${days})
        AND status IN ('paid', 'fulfilled')
    `
    const clubTotalsResult = await sql`
      SELECT
        COUNT(*) as total_orders,
        COALESCE(SUM(subtotal_usd), 0) as total_revenue
      FROM club_orders
      WHERE created_at >= NOW() - make_interval(days => ${days})
        AND status IN ('paid', 'waiting_to_ship', 'shipped', 'fulfilled')
    `

    // Get orders by status
    const statusResult = await sql`
      SELECT status, COUNT(*) as count
      FROM orders
      WHERE created_at >= NOW() - make_interval(days => ${days})
      GROUP BY status
    `

    // Get recent orders (most recent 20 for the table display)
    const recentResult = await sql`
      SELECT * FROM orders
      ORDER BY created_at DESC
      LIMIT 20
    `

    // Get ALL paid/fulfilled orders in the period for accurate top products
    const periodOrdersResult = await sql`
      SELECT items FROM orders
      WHERE created_at >= NOW() - make_interval(days => ${days})
        AND status IN ('paid', 'fulfilled')
    `

    const ordersByStatus: Record<string, number> = {}
    statusResult.rows.forEach(row => {
      ordersByStatus[row.status] = parseInt(row.count, 10)
    })

    // Calculate top products from ALL period orders (not just recent 20)
    const productMap = new Map<string, { sku: string; name: string; quantity: number; revenue: number }>()

    periodOrdersResult.rows.forEach(row => {
      const items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items
      if (Array.isArray(items)) {
        items.forEach((item: OrderItem) => {
          const existing = productMap.get(item.sku)
          if (existing) {
            existing.quantity += item.quantity
            existing.revenue += item.unit_price * item.quantity
          } else {
            productMap.set(item.sku, {
              sku: item.sku,
              name: item.name,
              quantity: item.quantity,
              revenue: item.unit_price * item.quantity,
            })
          }
        })
      }
    })

    const recentOrders = recentResult.rows.map(row => {
      const items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items
      return { ...row, items } as OrderEntry
    })

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    return {
      totalOrders:
        parseInt(totalsResult.rows[0]?.total_orders || '0', 10) +
        parseInt(clubTotalsResult.rows[0]?.total_orders || '0', 10),
      totalRevenue:
        parseFloat(totalsResult.rows[0]?.total_revenue || '0') +
        parseFloat(clubTotalsResult.rows[0]?.total_revenue || '0'),
      ordersByStatus,
      topProducts,
      recentOrders,
    }
  } catch (error) {
    console.error('Database error fetching sales stats:', error)
    throw new DatabaseError('Failed to fetch sales stats', error)
  }
}

export interface CouponStatRow {
  coupon_code: string
  discount_percent: number
  usage_count: number
  total_revenue: number
  total_discount: number
  avg_order_value: number
  creator_name: string | null
  attributed_creator_id: string | null
  program_type: string | null
}

export interface CouponStats {
  coupons: CouponStatRow[]
  totalCouponOrders: number
  totalCouponRevenue: number
  totalDiscountGiven: number
}

export async function getCouponStats(days = 30): Promise<CouponStats> {
  try {
    const result = await sql`
      WITH all_usages AS (
        SELECT
          coupon_code,
          discount_percent,
          attributed_creator_id,
          subtotal_usd as revenue,
          coupon_discount_usd as discount_actual,
          created_at
        FROM club_orders
        WHERE coupon_code IS NOT NULL AND coupon_code != ''
          AND status IN ('paid', 'waiting_to_ship', 'shipped', 'fulfilled')

        UNION ALL

        SELECT
          ac.code as coupon_code,
          ac.discount_value as discount_percent,
          ac.creator_id as attributed_creator_id,
          oa.net_revenue as revenue,
          NULL::numeric as discount_actual,
          oa.created_at
        FROM order_attributions oa
        JOIN affiliate_codes ac ON oa.code_id = ac.id
        WHERE oa.attribution_method = 'coupon_code'
          AND oa.status != 'refunded'
          AND (oa.order_id LIKE 'ORD-%' OR oa.order_id LIKE 'SUB-%' OR oa.order_id LIKE 'INV-%')
      )
      SELECT
        u.coupon_code,
        u.discount_percent,
        u.attributed_creator_id,
        COUNT(*)::int as usage_count,
        COALESCE(SUM(u.revenue), 0) as total_revenue,
        COALESCE(SUM(
          CASE
            WHEN u.discount_actual IS NOT NULL THEN u.discount_actual
            WHEN u.discount_percent > 0 AND u.discount_percent < 100
              THEN u.revenue * u.discount_percent / (100.0 - u.discount_percent)
            ELSE 0
          END
        ), 0) as total_discount,
        COALESCE(AVG(u.revenue), 0) as avg_order_value,
        c.full_name as creator_name,
        ac_match.program_type
      FROM all_usages u
      LEFT JOIN creators c ON u.attributed_creator_id = c.id
      LEFT JOIN LATERAL (
        SELECT program_type FROM affiliate_codes
        WHERE UPPER(code) = UPPER(u.coupon_code)
        ORDER BY active DESC, created_at DESC
        LIMIT 1
      ) ac_match ON TRUE
      WHERE u.created_at >= NOW() - make_interval(days => ${days})
        AND (ac_match.program_type IS NULL OR ac_match.program_type != 'prelaunch')
        -- Exclude orders attributed to owner creators (company CULTR* coupons have no creator_id, so they pass through)
        AND (c.id IS NULL OR LOWER(c.email) != ALL(${OWNER_EMAILS_PG_ARRAY}::text[]))
      GROUP BY u.coupon_code, u.discount_percent, u.attributed_creator_id, c.full_name, ac_match.program_type
      ORDER BY usage_count DESC
    `

    const coupons: CouponStatRow[] = result.rows.map(row => ({
      coupon_code: row.coupon_code,
      discount_percent: parseFloat(row.discount_percent || '0'),
      usage_count: parseInt(row.usage_count, 10),
      total_revenue: parseFloat(row.total_revenue || '0'),
      total_discount: parseFloat(row.total_discount || '0'),
      avg_order_value: parseFloat(row.avg_order_value || '0'),
      creator_name: row.creator_name || null,
      attributed_creator_id: row.attributed_creator_id || null,
      program_type: row.program_type || null,
    }))

    const totalCouponOrders = coupons.reduce((sum, c) => sum + c.usage_count, 0)
    const totalCouponRevenue = coupons.reduce((sum, c) => sum + c.total_revenue, 0)
    const totalDiscountGiven = coupons.reduce((sum, c) => sum + c.total_discount, 0)

    return { coupons, totalCouponOrders, totalCouponRevenue, totalDiscountGiven }
  } catch (error) {
    console.error('Database error fetching coupon stats:', error)
    throw new DatabaseError('Failed to fetch coupon stats', error)
  }
}

// ===========================================
// PRELAUNCH PROGRAM STATS (Admin Dashboard)
// ===========================================

export interface PrelaunchStats {
  totalCodes: number
  activeCodes: number
  expiredCodes: number
  totalRedemptions: number
  totalRevenue: number
  totalDiscountGiven: number
}

export async function getPrelaunchStats(): Promise<PrelaunchStats> {
  try {
    const codeResult = await sql`
      SELECT
        COUNT(*)::int as total_codes,
        COUNT(*) FILTER (WHERE active = TRUE AND (expires_at IS NULL OR expires_at > NOW()))::int as active_codes,
        COUNT(*) FILTER (WHERE active = TRUE AND expires_at IS NOT NULL AND expires_at <= NOW())::int as expired_codes
      FROM affiliate_codes
      WHERE program_type = 'prelaunch'
    `

    const redemptionResult = await sql`
      SELECT
        COUNT(*)::int as total_redemptions,
        COALESCE(SUM(co.subtotal_usd), 0) as total_revenue,
        COALESCE(SUM(
          CASE WHEN co.discount_percent > 0 AND co.discount_percent < 100
          THEN co.subtotal_usd * co.discount_percent / (100.0 - co.discount_percent)
          ELSE 0 END
        ), 0) as total_discount_given
      FROM club_orders co
      WHERE UPPER(co.coupon_code) IN (
        SELECT UPPER(code) FROM affiliate_codes WHERE program_type = 'prelaunch'
      )
        AND co.status IN ('paid', 'waiting_to_ship', 'shipped', 'fulfilled')
    `

    const codeRow = codeResult.rows[0] || {}
    const redemptionRow = redemptionResult.rows[0] || {}

    return {
      totalCodes: parseInt(codeRow.total_codes, 10) || 0,
      activeCodes: parseInt(codeRow.active_codes, 10) || 0,
      expiredCodes: parseInt(codeRow.expired_codes, 10) || 0,
      totalRedemptions: parseInt(redemptionRow.total_redemptions, 10) || 0,
      totalRevenue: parseFloat(redemptionRow.total_revenue || '0'),
      totalDiscountGiven: parseFloat(redemptionRow.total_discount_given || '0'),
    }
  } catch (error) {
    console.error('Database error fetching prelaunch stats:', error)
    throw new DatabaseError('Failed to fetch prelaunch stats', error)
  }
}

// ===========================================
// CREATOR COMMISSION STATS (Admin Dashboard)
// ===========================================

export interface CreatorCommissionStats {
  activeCreatorsWithCommissions: number
  totalPending: number
  totalApproved: number
  totalPaid: number
  totalLifetime: number
  creatorsByStatus: Record<string, number>
}

export interface CreatorCommissionAuditSummary {
  totalIssues: number
  creditedOrders: number
  creditedRevenue: number
  attributedClubOrders: number
  ledgerRows: number
  ledgerTotal: number
  checks: {
    missingAttribution: number
    attributionWithoutLedger: number
    directRateMismatches: number
    duplicateLedgerRows: number
    selfReferralLedgerRows: number
    overrideCapViolations: number
    missingRefundReversals: number
  }
}

export async function getCreatorCommissionStats(days = 30): Promise<CreatorCommissionStats> {
  try {
    const [commissionResult, statusResult] = await Promise.all([
      sql`
        SELECT
          COUNT(DISTINCT CASE WHEN cl.status != 'reversed' AND cl.created_at >= NOW() - make_interval(days => ${days}) THEN cl.beneficiary_creator_id END)::int as active_creators,
          COALESCE(SUM(CASE WHEN cl.status = 'pending' AND cl.created_at >= NOW() - make_interval(days => ${days}) THEN cl.commission_amount ELSE 0 END), 0) as total_pending,
          COALESCE(SUM(CASE WHEN cl.status = 'approved' AND cl.created_at >= NOW() - make_interval(days => ${days}) THEN cl.commission_amount ELSE 0 END), 0) as total_approved,
          COALESCE(SUM(CASE WHEN cl.status = 'paid' AND cl.created_at >= NOW() - make_interval(days => ${days}) THEN cl.commission_amount ELSE 0 END), 0) as total_paid,
          COALESCE(SUM(CASE WHEN cl.status != 'reversed' THEN cl.commission_amount ELSE 0 END), 0) as total_lifetime
        FROM commission_ledger cl
        JOIN creators c ON c.id = cl.beneficiary_creator_id
        WHERE LOWER(c.email) != ALL(${OWNER_EMAILS_PG_ARRAY}::text[])
      `,
      sql`
        SELECT status, COUNT(*)::int as count
        FROM creators
        WHERE LOWER(email) != ALL(${OWNER_EMAILS_PG_ARRAY}::text[])
        GROUP BY status
      `,
    ])

    const row = commissionResult.rows[0]
    const creatorsByStatus: Record<string, number> = {}
    statusResult.rows.forEach(r => {
      creatorsByStatus[r.status] = parseInt(r.count, 10)
    })
    return {
      activeCreatorsWithCommissions: parseInt(row?.active_creators || '0', 10),
      totalPending: parseFloat(row?.total_pending || '0'),
      totalApproved: parseFloat(row?.total_approved || '0'),
      totalPaid: parseFloat(row?.total_paid || '0'),
      totalLifetime: parseFloat(row?.total_lifetime || '0'),
      creatorsByStatus,
    }
  } catch (error) {
    console.error('Database error fetching creator commission stats:', error)
    throw new DatabaseError('Failed to fetch creator commission stats', error)
  }
}

export async function getCreatorCommissionAuditSummary(days = 30): Promise<CreatorCommissionAuditSummary> {
  const dateFilterDays = typeof days === 'number' && days > 0 ? days : null

  try {
    const [
      creditedResult,
      attributedClubOrderResult,
      missingAttributionResult,
      attributionWithoutLedgerResult,
      directRateMismatchResult,
      duplicateLedgerResult,
      selfReferralLedgerResult,
      overrideCapViolationResult,
      missingRefundReversalResult,
    ] = await Promise.all([
      sql`
        WITH eligible_attributions AS (
          SELECT oa.id, oa.net_revenue
          FROM order_attributions oa
          JOIN creators c ON c.id = oa.creator_id
          WHERE oa.is_self_referral = FALSE
            AND oa.status != 'refunded'
            AND oa.net_revenue > 0
            AND LOWER(c.email) != ALL(${OWNER_EMAILS_PG_ARRAY}::text[])
            AND (${dateFilterDays}::int IS NULL OR oa.created_at >= NOW() - make_interval(days => ${dateFilterDays}::int))
        ),
        ledger_totals AS (
          SELECT
            order_attribution_id,
            COUNT(*)::int AS ledger_rows,
            COALESCE(SUM(commission_amount), 0)::float8 AS ledger_total
          FROM commission_ledger
          WHERE status != 'reversed'
          GROUP BY order_attribution_id
        )
        SELECT
          COUNT(ea.id)::int AS credited_orders,
          COALESCE(SUM(ea.net_revenue), 0)::float8 AS credited_revenue,
          COALESCE(SUM(lt.ledger_rows), 0)::int AS ledger_rows,
          COALESCE(SUM(lt.ledger_total), 0)::float8 AS ledger_total
        FROM eligible_attributions ea
        LEFT JOIN ledger_totals lt ON lt.order_attribution_id = ea.id
      `,
      sql`
        SELECT COUNT(*)::int AS count
        FROM club_orders co
        JOIN creators c ON c.id = co.attributed_creator_id
        WHERE co.attributed_creator_id IS NOT NULL
          AND co.status NOT IN ('cancelled', 'dismissed', 'rejected')
          AND LOWER(c.email) != ALL(${OWNER_EMAILS_PG_ARRAY}::text[])
          AND (${dateFilterDays}::int IS NULL OR co.created_at >= NOW() - make_interval(days => ${dateFilterDays}::int))
      `,
      sql`
        SELECT COUNT(*)::int AS count
        FROM club_orders co
        JOIN creators c ON c.id = co.attributed_creator_id
        LEFT JOIN order_attributions oa ON oa.order_id = co.id::text
        WHERE co.attributed_creator_id IS NOT NULL
          AND COALESCE(co.subtotal_usd, 0) > 0
          AND co.status NOT IN ('cancelled', 'dismissed', 'rejected')
          AND LOWER(c.email) != ALL(${OWNER_EMAILS_PG_ARRAY}::text[])
          AND oa.id IS NULL
          AND (${dateFilterDays}::int IS NULL OR co.created_at >= NOW() - make_interval(days => ${dateFilterDays}::int))
      `,
      sql`
        SELECT COUNT(DISTINCT oa.id)::int AS count
        FROM order_attributions oa
        JOIN creators c ON c.id = oa.creator_id
        LEFT JOIN club_orders co ON co.id::text = oa.order_id
        LEFT JOIN commission_ledger cl
          ON cl.order_attribution_id = oa.id
         AND cl.status != 'reversed'
        WHERE oa.is_self_referral = FALSE
          AND oa.status != 'refunded'
          AND cl.id IS NULL
          AND (
            (co.id IS NULL AND oa.net_revenue > 0)
            OR (
              co.id IS NOT NULL
              AND co.status IN ('shipped', 'fulfilled')
              AND COALESCE(co.subtotal_usd, oa.net_revenue, 0) > 0
            )
          )
          AND LOWER(c.email) != ALL(${OWNER_EMAILS_PG_ARRAY}::text[])
          AND (${dateFilterDays}::int IS NULL OR COALESCE(co.created_at, oa.created_at) >= NOW() - make_interval(days => ${dateFilterDays}::int))
      `,
      sql`
        SELECT COUNT(*)::int AS count
        FROM order_attributions oa
        JOIN creators c ON c.id = oa.creator_id
        WHERE oa.is_self_referral = FALSE
          AND oa.status != 'refunded'
          AND oa.net_revenue > 0
          AND LOWER(c.email) != ALL(${OWNER_EMAILS_PG_ARRAY}::text[])
          AND (${dateFilterDays}::int IS NULL OR oa.created_at >= NOW() - make_interval(days => ${dateFilterDays}::int))
          AND (
            ROUND(oa.direct_commission_rate::numeric, 2) != ROUND(COALESCE(c.commission_rate, ${COMMISSION_CONFIG.directRate})::numeric, 2)
            OR ROUND(oa.direct_commission_amount::numeric, 2) != ROUND((oa.net_revenue * COALESCE(c.commission_rate, ${COMMISSION_CONFIG.directRate}) / 100)::numeric, 2)
          )
      `,
      sql`
        SELECT COUNT(*)::int AS count
        FROM (
          SELECT order_attribution_id, beneficiary_creator_id, commission_type
          FROM commission_ledger
          WHERE status != 'reversed'
            AND (${dateFilterDays}::int IS NULL OR created_at >= NOW() - make_interval(days => ${dateFilterDays}::int))
          GROUP BY order_attribution_id, beneficiary_creator_id, commission_type
          HAVING COUNT(*) > 1
        ) duplicates
      `,
      sql`
        SELECT COUNT(*)::int AS count
        FROM order_attributions oa
        JOIN creators c ON c.id = oa.creator_id
        JOIN commission_ledger cl ON cl.order_attribution_id = oa.id
        WHERE oa.is_self_referral = TRUE
          AND cl.status != 'reversed'
          AND LOWER(c.email) != ALL(${OWNER_EMAILS_PG_ARRAY}::text[])
          AND (${dateFilterDays}::int IS NULL OR oa.created_at >= NOW() - make_interval(days => ${dateFilterDays}::int))
      `,
      sql`
        SELECT COUNT(*)::int AS count
        FROM (
          SELECT oa.id
          FROM order_attributions oa
          JOIN creators c ON c.id = oa.creator_id
          JOIN commission_ledger cl ON cl.order_attribution_id = oa.id
          WHERE cl.status != 'reversed'
            AND oa.is_self_referral = FALSE
            AND LOWER(c.email) != ALL(${OWNER_EMAILS_PG_ARRAY}::text[])
            AND (${dateFilterDays}::int IS NULL OR oa.created_at >= NOW() - make_interval(days => ${dateFilterDays}::int))
          GROUP BY oa.id, oa.net_revenue
          HAVING SUM(cl.commission_amount) > ROUND((oa.net_revenue * ${COMMISSION_CONFIG.totalCapRate} / 100)::numeric, 2)
        ) cap_violations
      `,
      sql`
        SELECT COUNT(DISTINCT oa.id)::int AS count
        FROM order_attributions oa
        JOIN creators c ON c.id = oa.creator_id
        JOIN commission_ledger cl ON cl.order_attribution_id = oa.id
        WHERE oa.status = 'refunded'
          AND cl.status != 'reversed'
          AND LOWER(c.email) != ALL(${OWNER_EMAILS_PG_ARRAY}::text[])
          AND (${dateFilterDays}::int IS NULL OR oa.updated_at >= NOW() - make_interval(days => ${dateFilterDays}::int))
      `,
    ])

    const creditedRow = creditedResult.rows[0] || {}
    const checks = {
      missingAttribution: parseInt(missingAttributionResult.rows[0]?.count || '0', 10),
      attributionWithoutLedger: parseInt(attributionWithoutLedgerResult.rows[0]?.count || '0', 10),
      directRateMismatches: parseInt(directRateMismatchResult.rows[0]?.count || '0', 10),
      duplicateLedgerRows: parseInt(duplicateLedgerResult.rows[0]?.count || '0', 10),
      selfReferralLedgerRows: parseInt(selfReferralLedgerResult.rows[0]?.count || '0', 10),
      overrideCapViolations: parseInt(overrideCapViolationResult.rows[0]?.count || '0', 10),
      missingRefundReversals: parseInt(missingRefundReversalResult.rows[0]?.count || '0', 10),
    }

    return {
      totalIssues: Object.values(checks).reduce((sum, count) => sum + count, 0),
      creditedOrders: parseInt(creditedRow.credited_orders || '0', 10),
      creditedRevenue: parseFloat(creditedRow.credited_revenue || '0'),
      attributedClubOrders: parseInt(attributedClubOrderResult.rows[0]?.count || '0', 10),
      ledgerRows: parseInt(creditedRow.ledger_rows || '0', 10),
      ledgerTotal: parseFloat(creditedRow.ledger_total || '0'),
      checks,
    }
  } catch (error) {
    console.error('Database error fetching creator commission audit summary:', error)
    throw new DatabaseError('Failed to fetch creator commission audit summary', error)
  }
}

export async function getWaitlistStats(): Promise<{ total: number; bySource: Record<string, number>; recent: WaitlistEntry[] }> {
  try {
    const totalResult = await sql`SELECT COUNT(*) as count FROM waitlist`

    const sourceResult = await sql`
      SELECT COALESCE(source, 'direct') as source, COUNT(*) as count
      FROM waitlist
      GROUP BY COALESCE(source, 'direct')
    `

    const recentResult = await sql`
      SELECT * FROM waitlist
      ORDER BY created_at DESC
      LIMIT 20
    `

    const bySource: Record<string, number> = {}
    sourceResult.rows.forEach(row => {
      bySource[row.source] = parseInt(row.count, 10)
    })

    return {
      total: parseInt(totalResult.rows[0]?.count || '0', 10),
      bySource,
      recent: recentResult.rows as WaitlistEntry[],
    }
  } catch (error) {
    console.error('Database error fetching waitlist stats:', error)
    throw new DatabaseError('Failed to fetch waitlist stats', error)
  }
}

export async function getMembershipStats(): Promise<{ total: number; byTier: Record<string, number>; byStatus: Record<string, number> }> {
  try {
    // Note: We avoid UNION ALL to prevent parameter indexing issues in vercel/postgres
    // Instead we do two separate queries and combine them in JS
    const membershipsTotalResult = await sql`SELECT COUNT(*)::int as count FROM memberships WHERE subscription_status = 'active'`
    const clubTotalResult = await sql`SELECT COUNT(*)::int as count FROM club_members`

    const tierResult = await sql`
      SELECT plan_tier, COUNT(*)::int as count
      FROM memberships
      WHERE subscription_status = 'active'
      GROUP BY plan_tier
    `

    const statusResult = await sql`
      SELECT subscription_status, COUNT(*)::int as count
      FROM memberships
      GROUP BY subscription_status
    `

    const byTier: Record<string, number> = {}
    tierResult.rows.forEach(row => {
      byTier[row.plan_tier] = parseInt(row.count || '0', 10)
    })
    
    // Add club tier
    const clubTotal = parseInt(clubTotalResult.rows[0]?.count || '0', 10)
    if (clubTotal > 0) {
      byTier['club'] = (byTier['club'] || 0) + clubTotal
    }

    const byStatus: Record<string, number> = {}
    statusResult.rows.forEach(row => {
      byStatus[row.subscription_status] = parseInt(row.count || '0', 10)
    })
    
    // Add club members as active
    if (clubTotal > 0) {
      byStatus['active'] = (byStatus['active'] || 0) + clubTotal
    }

    return {
      total: Object.values(byTier).reduce((s, n) => s + n, 0),
      byTier,
      byStatus,
    }
  } catch (error) {
    console.error('Database error fetching membership stats:', error)
    throw new DatabaseError('Failed to fetch membership stats', error)
  }
}

// ===========================================
// ADMIN DASHBOARD — OPERATIONAL INTELLIGENCE
// ===========================================

export async function getInvoiceAging() {
  try {
    const result = await sql`
      SELECT id, order_number, member_name, member_email, items,
        subtotal_usd, coupon_code, discount_percent,
        tax_amount_usd, status, created_at,
        EXTRACT(DAY FROM NOW() - created_at)::int as days_pending
      FROM club_orders
      WHERE status IS DISTINCT FROM 'dismissed'
      ORDER BY created_at DESC
    `
    return result.rows
  } catch (error) {
    console.error('Database error fetching club orders:', error)
    throw new DatabaseError('Failed to fetch club orders', error)
  }
}

export async function getRefundStats(days: number) {
  try {
    const result = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'refunded')::int as refunded,
        COUNT(*)::int as total,
        COALESCE(SUM(CASE WHEN status = 'refunded' THEN total_amount ELSE 0 END), 0) as refunded_amount,
        COALESCE(SUM(total_amount), 0) as total_amount
      FROM orders WHERE created_at >= NOW() - make_interval(days => ${days})
    `
    const row = result.rows[0]
    const refunded = parseInt(row?.refunded || '0', 10)
    const total = parseInt(row?.total || '0', 10)
    return {
      refunded,
      total,
      refundedAmount: parseFloat(row?.refunded_amount || '0'),
      totalAmount: parseFloat(row?.total_amount || '0'),
      refundRate: total > 0 ? Math.round((refunded / total) * 10000) / 100 : 0,
    }
  } catch (error) {
    console.error('Database error fetching refund stats:', error)
    throw new DatabaseError('Failed to fetch refund stats', error)
  }
}

export async function getRevenueByTier(days: number) {
  try {
    const result = await sql`
      SELECT m.plan_tier as tier, COUNT(DISTINCT o.id)::int as orders, COALESCE(SUM(o.total_amount), 0) as revenue
      FROM orders o
      JOIN memberships m ON LOWER(o.customer_email) = LOWER(m.email)
      WHERE o.created_at >= NOW() - make_interval(days => ${days}) AND o.status IN ('paid', 'fulfilled')
      GROUP BY m.plan_tier ORDER BY revenue DESC
    `
    return result.rows.map(r => ({
      tier: r.tier,
      orders: parseInt(r.orders || '0', 10),
      revenue: parseFloat(r.revenue || '0'),
    }))
  } catch (error) {
    console.error('Database error fetching revenue by tier:', error)
    throw new DatabaseError('Failed to fetch revenue by tier', error)
  }
}

export async function getBnplAdoption(days: number) {
  try {
    const result = await sql`
      SELECT COALESCE(payment_provider, 'stripe') as provider, COUNT(*)::int as count
      FROM orders WHERE created_at >= NOW() - make_interval(days => ${days})
      GROUP BY COALESCE(payment_provider, 'stripe')
    `
    const byProvider: Record<string, number> = {}
    result.rows.forEach(r => { byProvider[r.provider] = parseInt(r.count || '0', 10) })
    return byProvider
  } catch (error) {
    console.error('Database error fetching BNPL adoption:', error)
    throw new DatabaseError('Failed to fetch BNPL adoption', error)
  }
}

export async function getCreatorROI(days?: number) {
  // Discount Given prefers the persisted club_orders.coupon_discount_usd (post
  // migration 052) and the snapshotted order_attributions.discount_rate (post
  // migration 062); both fall back to the subtotal*pct/(100-pct) formula when
  // null. net_revenue is stored post-discount, so formula = pre-discount - post
  // when discount applies to the whole order.
  //
  // Gross revenue = net_revenue + discount_given, used to derive the real
  // "business net" = gross - discount - commission.
  //
  // When `days` is provided, limits club_orders, order_attributions, and
  // commission_ledger rows to the last N days so the ROI table respects the
  // admin page's period selector.
  const dateFilterDays = typeof days === 'number' && days > 0 ? days : null
  try {
    const result = await sql`
      SELECT
        c.id, c.full_name, c.status,
        COALESCE((
          SELECT SUM(discount_amount)
          FROM (
            SELECT
              COALESCE(
                co.coupon_discount_usd,
                co.subtotal_usd * co.discount_percent / (100.0 - co.discount_percent)
              ) as discount_amount
            FROM club_orders co
            WHERE co.attributed_creator_id = c.id
              AND co.discount_percent > 0 AND co.discount_percent < 100
              AND co.subtotal_usd > 0
              -- Match the revenue filter: only shipped/fulfilled orders count.
              AND co.status IN ('shipped', 'fulfilled')
              AND (${dateFilterDays}::int IS NULL OR co.created_at >= NOW() - make_interval(days => ${dateFilterDays}::int))
            UNION ALL
            SELECT
              oa.net_revenue * COALESCE(oa.discount_rate, ac2.discount_value) /
                (100.0 - COALESCE(oa.discount_rate, ac2.discount_value)) as discount_amount
            FROM order_attributions oa
            JOIN affiliate_codes ac2 ON ac2.id = oa.code_id
            WHERE oa.creator_id = c.id
              AND oa.attribution_method = 'coupon_code'
              AND COALESCE(oa.discount_rate, ac2.discount_value) > 0
              AND COALESCE(oa.discount_rate, ac2.discount_value) < 100
              AND oa.net_revenue > 0
              AND oa.status != 'refunded'
              AND (oa.order_id LIKE 'ORD-%' OR oa.order_id LIKE 'SUB-%' OR oa.order_id LIKE 'INV-%')
              AND (${dateFilterDays}::int IS NULL OR oa.created_at >= NOW() - make_interval(days => ${dateFilterDays}::int))
          ) all_discounts
        ), 0) AS total_discount_given,
        COALESCE((
          SELECT SUM(co.subtotal_usd)
          FROM club_orders co
          WHERE co.attributed_creator_id = c.id
            AND co.subtotal_usd > 0
            -- Only count shipped/fulfilled orders: commission is deferred to
            -- shipment, so unshipped orders inflate revenue vs the creator view.
            AND co.status IN ('shipped', 'fulfilled')
            AND (${dateFilterDays}::int IS NULL OR co.created_at >= NOW() - make_interval(days => ${dateFilterDays}::int))
        ), 0)
        +
        COALESCE((
          SELECT SUM(oa.net_revenue)
          FROM order_attributions oa
          WHERE oa.creator_id = c.id
            AND oa.net_revenue > 0
            AND oa.status != 'refunded'
            AND (oa.order_id LIKE 'ORD-%' OR oa.order_id LIKE 'SUB-%' OR oa.order_id LIKE 'INV-%')
            AND (${dateFilterDays}::int IS NULL OR oa.created_at >= NOW() - make_interval(days => ${dateFilterDays}::int))
        ), 0) AS total_net_revenue,
        COALESCE((
          SELECT SUM(cl.commission_amount)
          FROM commission_ledger cl
          WHERE cl.beneficiary_creator_id = c.id
            AND cl.status != 'reversed'
            AND (${dateFilterDays}::int IS NULL OR cl.created_at >= NOW() - make_interval(days => ${dateFilterDays}::int))
        ), 0) AS total_commission_earned
      FROM creators c
      WHERE c.status = 'active'
        AND LOWER(c.email) != ALL(${OWNER_EMAILS_PG_ARRAY}::text[])
      ORDER BY total_commission_earned DESC
    `
    return result.rows.map(r => {
      const netRevenue = parseFloat(r.total_net_revenue || '0')
      const discount = parseFloat(r.total_discount_given || '0')
      const commission = parseFloat(r.total_commission_earned || '0')
      // Gross = what customers would have paid without the coupon
      const grossRevenue = netRevenue + discount
      // Business net = gross - discount - commission = net_revenue - commission
      const netBusinessImpact = netRevenue - commission
      return {
        id: r.id,
        fullName: r.full_name,
        totalDiscountGiven: discount,
        totalCommissionEarned: commission,
        totalNetRevenue: netRevenue,
        grossRevenue,
        netBusinessImpact,
      }
    })
  } catch (error) {
    console.error('Database error fetching creator ROI:', error)
    throw new DatabaseError('Failed to fetch creator ROI', error)
  }
}

export async function getIntakeFunnel(days: number) {
  try {
    const result = await sql`
      SELECT
        COUNT(*)::int as total_started,
        COUNT(*) FILTER (WHERE intake_status = 'completed')::int as completed,
        COUNT(*) FILTER (WHERE intake_status = 'pending')::int as pending
      FROM pending_intakes WHERE created_at >= NOW() - make_interval(days => ${days})
    `
    const row = result.rows[0]
    const totalStarted = parseInt(row?.total_started || '0', 10)
    const completed = parseInt(row?.completed || '0', 10)
    return {
      totalStarted,
      completed,
      pending: parseInt(row?.pending || '0', 10),
      completionRate: totalStarted > 0 ? Math.round((completed / totalStarted) * 10000) / 100 : 0,
    }
  } catch (error) {
    console.error('Database error fetching intake funnel:', error)
    throw new DatabaseError('Failed to fetch intake funnel', error)
  }
}

// ===========================================
// ADMIN DASHBOARD — FULL DATA VIEWS
// ===========================================

export async function getAllCreatorsForAdmin(days?: number) {
  // When `days` is provided, total_code_revenue is scoped to that window so it
  // aligns with the admin page's period selector. Otherwise it stays lifetime.
  const dateFilterDays = typeof days === 'number' && days > 0 ? days : null
  try {
    const result = await sql`
      SELECT
        c.*,
        (SELECT COUNT(*)::int FROM affiliate_codes ac WHERE ac.creator_id = c.id AND ac.active = TRUE) as code_count,
        (
          SELECT COALESCE(SUM(oa.net_revenue), 0)::float8
          FROM order_attributions oa
          WHERE oa.creator_id = c.id
            AND oa.status != 'refunded'
            AND (${dateFilterDays}::int IS NULL OR oa.created_at >= NOW() - make_interval(days => ${dateFilterDays}::int))
        ) as total_code_revenue
      FROM creators c
      WHERE LOWER(c.email) != ALL(${OWNER_EMAILS_PG_ARRAY}::text[])
      ORDER BY c.created_at DESC
    `
    return result.rows
  } catch (error) {
    console.error('Database error fetching all creators:', error)
    throw new DatabaseError('Failed to fetch all creators', error)
  }
}

export async function getAllTrackingLinksForAdmin() {
  try {
    const result = await sql`
      SELECT
        tl.*,
        c.full_name as creator_name,
        c.status as creator_status,
        COALESCE(ce_stats.real_conversions, 0)::int as real_conversion_count
      FROM tracking_links tl
      LEFT JOIN creators c ON tl.creator_id = c.id
      LEFT JOIN (
        SELECT link_id, COUNT(*) FILTER (WHERE converted = TRUE) as real_conversions
        FROM click_events
        WHERE link_id IS NOT NULL
        GROUP BY link_id
      ) ce_stats ON ce_stats.link_id = tl.id
      WHERE c.id IS NULL OR LOWER(c.email) != ALL(${OWNER_EMAILS_PG_ARRAY}::text[])
      ORDER BY tl.click_count DESC, tl.created_at DESC
    `
    // Use the live count from click_events if it's higher than the stale counter
    return result.rows.map(r => ({
      ...r,
      conversion_count: Math.max(
        Number(r.conversion_count) || 0,
        Number(r.real_conversion_count) || 0
      ),
    }))
  } catch (error) {
    console.error('Database error fetching all tracking links:', error)
    throw new DatabaseError('Failed to fetch all tracking links', error)
  }
}

export async function getCreatorLinkPerformance(days: number) {
  try {
    const result = await sql`
      SELECT
        c.id AS creator_id,
        c.full_name AS creator_name,
        COUNT(ce.id)::int AS total_clicks,
        COUNT(CASE WHEN ce.converted = true THEN 1 END)::int AS converted_clicks,
        COUNT(CASE WHEN ce.converted = false THEN 1 END)::int AS non_converted_clicks,
        ROUND(
          COUNT(CASE WHEN ce.converted = true THEN 1 END)::numeric
          / NULLIF(COUNT(ce.id), 0) * 100, 1
        )::float8 AS conversion_rate
      FROM click_events ce
      JOIN creators c ON ce.creator_id = c.id
      WHERE ce.clicked_at >= NOW() - make_interval(days => ${days})
        AND LOWER(c.email) != ALL(${OWNER_EMAILS_PG_ARRAY}::text[])
      GROUP BY c.id, c.full_name
      ORDER BY total_clicks DESC
    `
    return result.rows
  } catch (error) {
    console.error('Database error fetching creator link performance:', error)
    throw new DatabaseError('Failed to fetch creator link performance', error)
  }
}

export async function getAllAffiliateCodesForAdmin() {
  try {
    const result = await sql`
      SELECT
        ac.*,
        CASE
          WHEN ac.creator_id IS NULL THEN COALESCE(company_stats.usage_count, 0)
          ELSE COALESCE(creator_stats.usage_count, 0)
        END AS use_count,
        CASE
          WHEN ac.creator_id IS NULL THEN COALESCE(company_stats.total_revenue, 0)
          ELSE COALESCE(creator_stats.total_revenue, 0)
        END AS total_revenue,
        c.full_name as creator_name,
        c.status as creator_status
      FROM affiliate_codes ac
      LEFT JOIN creators c ON ac.creator_id = c.id
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*)::int AS usage_count,
          COALESCE(SUM(co.subtotal_usd), 0) AS total_revenue
        FROM club_orders co
        WHERE UPPER(co.coupon_code) = UPPER(ac.code)
          AND co.status IN ('paid', 'waiting_to_ship', 'shipped', 'fulfilled')
      ) company_stats ON TRUE
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*)::int AS usage_count,
          COALESCE(SUM(oa.net_revenue), 0) AS total_revenue
        FROM order_attributions oa
        WHERE oa.code_id = ac.id
          AND oa.status != 'refunded'
      ) creator_stats ON TRUE
      WHERE c.id IS NULL OR LOWER(c.email) != ALL(${OWNER_EMAILS_PG_ARRAY}::text[])
      ORDER BY use_count DESC, ac.created_at DESC
    `
    return result.rows
  } catch (error) {
    console.error('Database error fetching all affiliate codes:', error)
    throw new DatabaseError('Failed to fetch all affiliate codes', error)
  }
}

export async function getAllCustomersForAdmin() {
  try {
    const result = await sql`
      SELECT
        cm.*,
        COALESCE(os.order_count, 0)::int as order_count,
        COALESCE(os.total_spent, 0) as total_spent,
        COALESCE(os.valid_order_count, 0) > 0 as converted,
        CASE WHEN COALESCE(os.valid_order_count, 0) > 0
          THEN ROUND((os.valid_spent / os.valid_order_count)::numeric, 2)::float8
          ELSE NULL
        END as avg_order_value
      FROM club_members cm
      LEFT JOIN (
        SELECT
          member_id,
          COUNT(*)::int as order_count,
          COALESCE(SUM(subtotal_usd), 0)::float8 as total_spent,
          COUNT(*) FILTER (WHERE status NOT IN ('cancelled', 'rejected', 'dismissed'))::int as valid_order_count,
          COALESCE(SUM(subtotal_usd) FILTER (WHERE status NOT IN ('cancelled', 'rejected', 'dismissed')), 0)::float8 as valid_spent
        FROM club_orders
        GROUP BY member_id
      ) os ON os.member_id = cm.id
      ORDER BY cm.created_at DESC
    `
    return result.rows
  } catch (error) {
    console.error('Database error fetching all customers:', error)
    throw new DatabaseError('Failed to fetch all customers', error)
  }
}

export async function getAdminDashboardCounts() {
  try {
    const [customersResult, invoicesResult] = await Promise.all([
      sql`SELECT COUNT(*)::int as total FROM club_members`,
      sql`SELECT COUNT(*)::int as total FROM club_orders WHERE status = 'pending_approval'`,
    ])
    return {
      totalCustomers: customersResult.rows[0]?.total || 0,
      pendingInvoices: invoicesResult.rows[0]?.total || 0,
    }
  } catch (error) {
    console.error('Database error fetching dashboard counts:', error)
    throw new DatabaseError('Failed to fetch dashboard counts', error)
  }
}

// ===========================================
// DATABASE CONNECTION TEST
// ===========================================

export async function testDatabaseConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    await sql`SELECT 1`
    return { success: true }
  } catch (error) {
    console.error('Database connection test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown database error'
    }
  }
}

// ===========================================
// REJUVENATION DATA INFRASTRUCTURE
// For Altos Labs acquisition positioning
// ===========================================

// ─────────────────────────────────────────────────────────────────────────────
// DAILY LOG TYPES & FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export interface DailyLogEntry {
  id: string
  user_id: string
  asher_patient_id?: number | string
  log_date: string
  energy_level?: number
  mood_rating?: number
  sleep_quality?: number
  sleep_hours?: number
  stress_level?: number
  weight_kg?: number
  resting_hr?: number
  hrv_ms?: number
  blood_pressure_systolic?: number
  blood_pressure_diastolic?: number
  wearable_source?: string
  wearable_sleep_score?: number
  wearable_readiness_score?: number
  wearable_activity_score?: number
  deep_sleep_minutes?: number
  rem_sleep_minutes?: number
  steps?: number
  protocol_id?: string
  protocol_adherence_pct?: number
  supplements_taken?: string[]
  peptides_administered?: string[]
  notes?: string
  symptoms_reported?: string[]
  created_at: Date
  updated_at: Date
}

export interface CreateDailyLogInput {
  user_id: string
  asher_patient_id?: number | string
  log_date: string
  energy_level?: number
  mood_rating?: number
  sleep_quality?: number
  sleep_hours?: number
  stress_level?: number
  weight_kg?: number
  resting_hr?: number
  hrv_ms?: number
  blood_pressure_systolic?: number
  blood_pressure_diastolic?: number
  wearable_source?: string
  wearable_sleep_score?: number
  wearable_readiness_score?: number
  wearable_activity_score?: number
  deep_sleep_minutes?: number
  rem_sleep_minutes?: number
  steps?: number
  protocol_id?: string
  protocol_adherence_pct?: number
  supplements_taken?: string[]
  peptides_administered?: string[]
  notes?: string
  symptoms_reported?: string[]
}

export async function createOrUpdateDailyLog(input: CreateDailyLogInput): Promise<{ id: string; isNew: boolean }> {
  try {
    const result = await sql`
      INSERT INTO daily_logs (
        user_id, asher_patient_id, log_date,
        energy_level, mood_rating, sleep_quality, sleep_hours, stress_level,
        weight_kg, resting_hr, hrv_ms, blood_pressure_systolic, blood_pressure_diastolic,
        wearable_source, wearable_sleep_score, wearable_readiness_score, wearable_activity_score,
        deep_sleep_minutes, rem_sleep_minutes, steps,
        protocol_id, protocol_adherence_pct, supplements_taken, peptides_administered,
        notes, symptoms_reported, created_at, updated_at
      )
      VALUES (
        ${input.user_id}, ${input.asher_patient_id || null}, ${input.log_date},
        ${input.energy_level || null}, ${input.mood_rating || null}, ${input.sleep_quality || null}, 
        ${input.sleep_hours || null}, ${input.stress_level || null},
        ${input.weight_kg || null}, ${input.resting_hr || null}, ${input.hrv_ms || null},
        ${input.blood_pressure_systolic || null}, ${input.blood_pressure_diastolic || null},
        ${input.wearable_source || null}, ${input.wearable_sleep_score || null},
        ${input.wearable_readiness_score || null}, ${input.wearable_activity_score || null},
        ${input.deep_sleep_minutes || null}, ${input.rem_sleep_minutes || null}, ${input.steps || null},
        ${input.protocol_id || null}, ${input.protocol_adherence_pct || null},
        ${JSON.stringify(input.supplements_taken || [])}, ${JSON.stringify(input.peptides_administered || [])},
        ${input.notes || null}, ${input.symptoms_reported ? JSON.stringify(input.symptoms_reported) : null},
        NOW(), NOW()
      )
      ON CONFLICT (user_id, log_date)
      DO UPDATE SET
        energy_level = COALESCE(EXCLUDED.energy_level, daily_logs.energy_level),
        mood_rating = COALESCE(EXCLUDED.mood_rating, daily_logs.mood_rating),
        sleep_quality = COALESCE(EXCLUDED.sleep_quality, daily_logs.sleep_quality),
        sleep_hours = COALESCE(EXCLUDED.sleep_hours, daily_logs.sleep_hours),
        stress_level = COALESCE(EXCLUDED.stress_level, daily_logs.stress_level),
        weight_kg = COALESCE(EXCLUDED.weight_kg, daily_logs.weight_kg),
        resting_hr = COALESCE(EXCLUDED.resting_hr, daily_logs.resting_hr),
        hrv_ms = COALESCE(EXCLUDED.hrv_ms, daily_logs.hrv_ms),
        blood_pressure_systolic = COALESCE(EXCLUDED.blood_pressure_systolic, daily_logs.blood_pressure_systolic),
        blood_pressure_diastolic = COALESCE(EXCLUDED.blood_pressure_diastolic, daily_logs.blood_pressure_diastolic),
        wearable_source = COALESCE(EXCLUDED.wearable_source, daily_logs.wearable_source),
        wearable_sleep_score = COALESCE(EXCLUDED.wearable_sleep_score, daily_logs.wearable_sleep_score),
        wearable_readiness_score = COALESCE(EXCLUDED.wearable_readiness_score, daily_logs.wearable_readiness_score),
        wearable_activity_score = COALESCE(EXCLUDED.wearable_activity_score, daily_logs.wearable_activity_score),
        deep_sleep_minutes = COALESCE(EXCLUDED.deep_sleep_minutes, daily_logs.deep_sleep_minutes),
        rem_sleep_minutes = COALESCE(EXCLUDED.rem_sleep_minutes, daily_logs.rem_sleep_minutes),
        steps = COALESCE(EXCLUDED.steps, daily_logs.steps),
        protocol_id = COALESCE(EXCLUDED.protocol_id, daily_logs.protocol_id),
        protocol_adherence_pct = COALESCE(EXCLUDED.protocol_adherence_pct, daily_logs.protocol_adherence_pct),
        supplements_taken = COALESCE(EXCLUDED.supplements_taken, daily_logs.supplements_taken),
        peptides_administered = COALESCE(EXCLUDED.peptides_administered, daily_logs.peptides_administered),
        notes = COALESCE(EXCLUDED.notes, daily_logs.notes),
        symptoms_reported = COALESCE(EXCLUDED.symptoms_reported, daily_logs.symptoms_reported),
        updated_at = NOW()
      RETURNING id, (xmax = 0) as is_new
    `
    return { id: result.rows[0].id, isNew: result.rows[0].is_new }
  } catch (error) {
    console.error('Database error creating/updating daily log:', error)
    throw new DatabaseError('Failed to create/update daily log', error)
  }
}

export async function getDailyLogsByUser(
  userId: string,
  limit = 30,
  offset = 0
): Promise<DailyLogEntry[]> {
  try {
    const result = await sql`
      SELECT * FROM daily_logs
      WHERE user_id = ${userId}
      ORDER BY log_date DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    return result.rows as DailyLogEntry[]
  } catch (error) {
    console.error('Database error fetching daily logs:', error)
    throw new DatabaseError('Failed to fetch daily logs', error)
  }
}

export async function getDailyLogByDate(
  userId: string,
  date: string
): Promise<DailyLogEntry | null> {
  try {
    const result = await sql`
      SELECT * FROM daily_logs
      WHERE user_id = ${userId} AND log_date = ${date}
    `
    return result.rows[0] as DailyLogEntry | null
  } catch (error) {
    console.error('Database error fetching daily log:', error)
    throw new DatabaseError('Failed to fetch daily log', error)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BIOMARKER ENTRY TYPES & FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export interface BiomarkerEntry {
  id: string
  user_id: string
  asher_patient_id?: number | string
  biomarker_id: string
  biomarker_name: string
  category: string
  value: number
  unit: string
  original_value?: string
  original_unit?: string
  original_name?: string
  confidence: 'high' | 'medium' | 'low'
  conversion_applied: boolean
  source?: string
  lab_company?: string
  reference_range?: string
  measured_at: string
  score?: number
  status?: 'optimal' | 'acceptable' | 'suboptimal' | 'critical'
  created_at: Date
  updated_at: Date
}

export interface CreateBiomarkerEntryInput {
  user_id: string
  asher_patient_id?: number | string
  biomarker_id: string
  biomarker_name: string
  category: string
  value: number
  unit: string
  original_value?: string
  original_unit?: string
  original_name?: string
  confidence?: 'high' | 'medium' | 'low'
  conversion_applied?: boolean
  source?: string
  lab_company?: string
  reference_range?: string
  measured_at: string
  score?: number
  status?: 'optimal' | 'acceptable' | 'suboptimal' | 'critical'
}

export async function createBiomarkerEntry(input: CreateBiomarkerEntryInput): Promise<{ id: string }> {
  try {
    const result = await sql`
      INSERT INTO biomarker_entries (
        user_id, asher_patient_id, biomarker_id, biomarker_name, category,
        value, unit, original_value, original_unit, original_name,
        confidence, conversion_applied, source, lab_company, reference_range,
        measured_at, score, status, created_at, updated_at
      )
      VALUES (
        ${input.user_id}, ${input.asher_patient_id || null},
        ${input.biomarker_id}, ${input.biomarker_name}, ${input.category},
        ${input.value}, ${input.unit}, ${input.original_value || null},
        ${input.original_unit || null}, ${input.original_name || null},
        ${input.confidence || 'high'}, ${input.conversion_applied || false},
        ${input.source || null}, ${input.lab_company || null}, ${input.reference_range || null},
        ${input.measured_at}, ${input.score || null}, ${input.status || null},
        NOW(), NOW()
      )
      ON CONFLICT (user_id, biomarker_id, measured_at)
      DO UPDATE SET
        value = EXCLUDED.value,
        unit = EXCLUDED.unit,
        score = EXCLUDED.score,
        status = EXCLUDED.status,
        updated_at = NOW()
      RETURNING id
    `
    return { id: result.rows[0].id }
  } catch (error) {
    console.error('Database error creating biomarker entry:', error)
    throw new DatabaseError('Failed to create biomarker entry', error)
  }
}

export async function getBiomarkersByUser(
  userId: string,
  biomarkerId?: string,
  limit = 100
): Promise<BiomarkerEntry[]> {
  try {
    if (biomarkerId) {
      const result = await sql`
        SELECT * FROM biomarker_entries
        WHERE user_id = ${userId} AND biomarker_id = ${biomarkerId}
        ORDER BY measured_at DESC
        LIMIT ${limit}
      `
      return result.rows as BiomarkerEntry[]
    }

    const result = await sql`
      SELECT * FROM biomarker_entries
      WHERE user_id = ${userId}
      ORDER BY measured_at DESC
      LIMIT ${limit}
    `
    return result.rows as BiomarkerEntry[]
  } catch (error) {
    console.error('Database error fetching biomarker entries:', error)
    throw new DatabaseError('Failed to fetch biomarker entries', error)
  }
}

export async function getLatestBiomarkers(userId: string): Promise<BiomarkerEntry[]> {
  try {
    const result = await sql`
      SELECT DISTINCT ON (biomarker_id) *
      FROM biomarker_entries
      WHERE user_id = ${userId}
      ORDER BY biomarker_id, measured_at DESC
    `
    return result.rows as BiomarkerEntry[]
  } catch (error) {
    console.error('Database error fetching latest biomarkers:', error)
    throw new DatabaseError('Failed to fetch latest biomarkers', error)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROTOCOL OUTCOME TYPES & FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export interface ExpectedOutcome {
  biomarkerId: string
  biomarkerName: string
  targetValue: number
  direction: 'increase' | 'decrease' | 'maintain'
  timeframeWeeks: number
}

export interface ActualOutcome {
  biomarkerId: string
  biomarkerName: string
  baselineValue: number
  endValue: number
  percentChange: number
  goalMet: boolean
}

export interface ProtocolOutcomeEntry {
  id: string
  user_id: string
  asher_patient_id?: number | string
  protocol_id: string
  protocol_version: string
  protocol_type: 'template' | 'symptom' | 'custom'
  template_id?: string
  symptom_ids?: string[]
  started_at: string
  ended_at?: string
  duration_weeks?: number
  expected_outcomes: ExpectedOutcome[]
  actual_outcomes: ActualOutcome[]
  success_score?: number
  goals_met: number
  goals_total: number
  baseline_resilience_score?: number
  end_resilience_score?: number
  resilience_delta?: number
  baseline_phenotype?: string
  end_phenotype?: string
  average_adherence_pct?: number
  total_log_days: number
  user_effectiveness_rating?: number
  user_would_repeat?: boolean
  user_notes?: string
  side_effects_reported?: string[]
  adverse_events?: Record<string, unknown>
  status: 'active' | 'completed' | 'abandoned' | 'paused'
  created_at: Date
  updated_at: Date
}

export interface CreateProtocolOutcomeInput {
  user_id: string
  asher_patient_id?: number | string
  protocol_id: string
  protocol_version: string
  protocol_type: 'template' | 'symptom' | 'custom'
  template_id?: string
  symptom_ids?: string[]
  started_at: string
  expected_outcomes?: ExpectedOutcome[]
  baseline_resilience_score?: number
  baseline_phenotype?: string
}

export async function createProtocolOutcome(input: CreateProtocolOutcomeInput): Promise<{ id: string }> {
  try {
    const result = await sql`
      INSERT INTO protocol_outcomes (
        user_id, asher_patient_id, protocol_id, protocol_version, protocol_type,
        template_id, symptom_ids, started_at, expected_outcomes,
        baseline_resilience_score, baseline_phenotype, status,
        goals_total, created_at, updated_at
      )
      VALUES (
        ${input.user_id}, ${input.asher_patient_id || null},
        ${input.protocol_id}, ${input.protocol_version}, ${input.protocol_type},
        ${input.template_id || null}, ${input.symptom_ids ? JSON.stringify(input.symptom_ids) : null},
        ${input.started_at}, ${JSON.stringify(input.expected_outcomes || [])},
        ${input.baseline_resilience_score || null}, ${input.baseline_phenotype || null},
        'active', ${input.expected_outcomes?.length || 0},
        NOW(), NOW()
      )
      RETURNING id
    `
    return { id: result.rows[0].id }
  } catch (error) {
    console.error('Database error creating protocol outcome:', error)
    throw new DatabaseError('Failed to create protocol outcome', error)
  }
}

export interface UpdateProtocolOutcomeInput {
  ended_at?: string
  duration_weeks?: number
  actual_outcomes?: ActualOutcome[]
  success_score?: number
  goals_met?: number
  end_resilience_score?: number
  resilience_delta?: number
  end_phenotype?: string
  average_adherence_pct?: number
  total_log_days?: number
  user_effectiveness_rating?: number
  user_would_repeat?: boolean
  user_notes?: string
  side_effects_reported?: string[]
  status?: 'active' | 'completed' | 'abandoned' | 'paused'
}

export async function updateProtocolOutcome(
  outcomeId: string,
  input: UpdateProtocolOutcomeInput
): Promise<boolean> {
  try {
    const result = await sql`
      UPDATE protocol_outcomes
      SET
        ended_at = COALESCE(${input.ended_at || null}, ended_at),
        duration_weeks = COALESCE(${input.duration_weeks || null}, duration_weeks),
        actual_outcomes = COALESCE(${input.actual_outcomes ? JSON.stringify(input.actual_outcomes) : null}, actual_outcomes),
        success_score = COALESCE(${input.success_score || null}, success_score),
        goals_met = COALESCE(${input.goals_met || null}, goals_met),
        end_resilience_score = COALESCE(${input.end_resilience_score || null}, end_resilience_score),
        resilience_delta = COALESCE(${input.resilience_delta || null}, resilience_delta),
        end_phenotype = COALESCE(${input.end_phenotype || null}, end_phenotype),
        average_adherence_pct = COALESCE(${input.average_adherence_pct || null}, average_adherence_pct),
        total_log_days = COALESCE(${input.total_log_days || null}, total_log_days),
        user_effectiveness_rating = COALESCE(${input.user_effectiveness_rating || null}, user_effectiveness_rating),
        user_would_repeat = COALESCE(${input.user_would_repeat ?? null}, user_would_repeat),
        user_notes = COALESCE(${input.user_notes || null}, user_notes),
        side_effects_reported = COALESCE(${input.side_effects_reported ? JSON.stringify(input.side_effects_reported) : null}, side_effects_reported),
        status = COALESCE(${input.status || null}, status),
        updated_at = NOW()
      WHERE id = ${outcomeId}
    `
    return (result.rowCount ?? 0) > 0
  } catch (error) {
    console.error('Database error updating protocol outcome:', error)
    throw new DatabaseError('Failed to update protocol outcome', error)
  }
}

export async function getActiveProtocolOutcome(userId: string): Promise<ProtocolOutcomeEntry | null> {
  try {
    const result = await sql`
      SELECT * FROM protocol_outcomes
      WHERE user_id = ${userId} AND status = 'active'
      ORDER BY started_at DESC
      LIMIT 1
    `
    if (!result.rows[0]) return null

    return {
      ...result.rows[0],
      expected_outcomes: typeof result.rows[0].expected_outcomes === 'string'
        ? JSON.parse(result.rows[0].expected_outcomes)
        : result.rows[0].expected_outcomes,
      actual_outcomes: typeof result.rows[0].actual_outcomes === 'string'
        ? JSON.parse(result.rows[0].actual_outcomes)
        : result.rows[0].actual_outcomes,
    } as ProtocolOutcomeEntry
  } catch (error) {
    console.error('Database error fetching active protocol outcome:', error)
    throw new DatabaseError('Failed to fetch active protocol outcome', error)
  }
}

export async function getProtocolOutcomesByUser(
  userId: string,
  limit = 20
): Promise<ProtocolOutcomeEntry[]> {
  try {
    const result = await sql`
      SELECT * FROM protocol_outcomes
      WHERE user_id = ${userId}
      ORDER BY started_at DESC
      LIMIT ${limit}
    `
    return result.rows.map(row => ({
      ...row,
      expected_outcomes: typeof row.expected_outcomes === 'string'
        ? JSON.parse(row.expected_outcomes)
        : row.expected_outcomes,
      actual_outcomes: typeof row.actual_outcomes === 'string'
        ? JSON.parse(row.actual_outcomes)
        : row.actual_outcomes,
    })) as ProtocolOutcomeEntry[]
  } catch (error) {
    console.error('Database error fetching protocol outcomes:', error)
    throw new DatabaseError('Failed to fetch protocol outcomes', error)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RESILIENCE SCORE HISTORY TYPES & FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export interface ResilienceScoreEntry {
  id: string
  user_id: string
  asher_patient_id?: number | string
  overall_score: number
  grade: string
  category_scores: Record<string, number>
  data_completeness: number
  biomarkers_used: number
  chronological_age?: number
  biological_age?: number
  age_gap?: number
  primary_phenotype?: string
  secondary_phenotypes?: string[]
  phenotype_confidence?: number
  top_strengths?: string[]
  priority_areas?: string[]
  protocol_outcome_id?: string
  calculated_at: Date
  created_at: Date
}

export interface CreateResilienceScoreInput {
  user_id: string
  asher_patient_id?: number | string
  overall_score: number
  grade: string
  category_scores: Record<string, number>
  data_completeness: number
  biomarkers_used: number
  chronological_age?: number
  biological_age?: number
  age_gap?: number
  primary_phenotype?: string
  secondary_phenotypes?: string[]
  phenotype_confidence?: number
  top_strengths?: string[]
  priority_areas?: string[]
  protocol_outcome_id?: string
}

export async function createResilienceScore(input: CreateResilienceScoreInput): Promise<{ id: string }> {
  try {
    const result = await sql`
      INSERT INTO resilience_scores (
        user_id, asher_patient_id, overall_score, grade, category_scores,
        data_completeness, biomarkers_used, chronological_age, biological_age, age_gap,
        primary_phenotype, secondary_phenotypes, phenotype_confidence,
        top_strengths, priority_areas, protocol_outcome_id,
        calculated_at, created_at
      )
      VALUES (
        ${input.user_id}, ${input.asher_patient_id || null},
        ${input.overall_score}, ${input.grade}, ${JSON.stringify(input.category_scores)},
        ${input.data_completeness}, ${input.biomarkers_used},
        ${input.chronological_age || null}, ${input.biological_age || null}, ${input.age_gap || null},
        ${input.primary_phenotype || null}, ${input.secondary_phenotypes ? JSON.stringify(input.secondary_phenotypes) : null}, ${input.phenotype_confidence || null},
        ${input.top_strengths ? JSON.stringify(input.top_strengths) : null}, ${input.priority_areas ? JSON.stringify(input.priority_areas) : null}, ${input.protocol_outcome_id || null},
        NOW(), NOW()
      )
      RETURNING id
    `
    return { id: result.rows[0].id }
  } catch (error) {
    console.error('Database error creating resilience score:', error)
    throw new DatabaseError('Failed to create resilience score', error)
  }
}

export async function getResilienceScoreHistory(
  userId: string,
  limit = 50
): Promise<ResilienceScoreEntry[]> {
  try {
    const result = await sql`
      SELECT * FROM resilience_scores
      WHERE user_id = ${userId}
      ORDER BY calculated_at DESC
      LIMIT ${limit}
    `
    return result.rows.map(row => ({
      ...row,
      category_scores: typeof row.category_scores === 'string'
        ? JSON.parse(row.category_scores)
        : row.category_scores,
    })) as ResilienceScoreEntry[]
  } catch (error) {
    console.error('Database error fetching resilience score history:', error)
    throw new DatabaseError('Failed to fetch resilience score history', error)
  }
}

export async function getLatestResilienceScore(userId: string): Promise<ResilienceScoreEntry | null> {
  try {
    const result = await sql`
      SELECT * FROM resilience_scores
      WHERE user_id = ${userId}
      ORDER BY calculated_at DESC
      LIMIT 1
    `
    if (!result.rows[0]) return null

    return {
      ...result.rows[0],
      category_scores: typeof result.rows[0].category_scores === 'string'
        ? JSON.parse(result.rows[0].category_scores)
        : result.rows[0].category_scores,
    } as ResilienceScoreEntry
  } catch (error) {
    console.error('Database error fetching latest resilience score:', error)
    throw new DatabaseError('Failed to fetch latest resilience score', error)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS FOR ALTOS LABS DATA EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export interface CohortAnalytics {
  totalUsers: number
  totalProtocols: number
  totalBiomarkerEntries: number
  avgResilienceScore: number
  phenotypeDistribution: Record<string, number>
  protocolSuccessRate: number
  avgAgeGap: number
}

export async function getCohortAnalytics(): Promise<CohortAnalytics> {
  try {
    const usersResult = await sql`SELECT COUNT(DISTINCT user_id) as count FROM resilience_scores`
    const protocolsResult = await sql`SELECT COUNT(*) as count FROM protocol_outcomes WHERE status = 'completed'`
    const biomarkersResult = await sql`SELECT COUNT(*) as count FROM biomarker_entries`

    const avgScoreResult = await sql`
      SELECT AVG(overall_score) as avg_score
      FROM (
        SELECT DISTINCT ON (user_id) overall_score
        FROM resilience_scores
        ORDER BY user_id, calculated_at DESC
      ) latest_scores
    `

    const phenotypeResult = await sql`
      SELECT primary_phenotype, COUNT(*) as count
      FROM (
        SELECT DISTINCT ON (user_id) primary_phenotype
        FROM resilience_scores
        WHERE primary_phenotype IS NOT NULL
        ORDER BY user_id, calculated_at DESC
      ) latest_phenotypes
      GROUP BY primary_phenotype
    `

    const successResult = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE success_score >= 70) as successful,
        COUNT(*) as total
      FROM protocol_outcomes
      WHERE status = 'completed'
    `

    const ageGapResult = await sql`
      SELECT AVG(age_gap) as avg_gap
      FROM (
        SELECT DISTINCT ON (user_id) age_gap
        FROM resilience_scores
        WHERE age_gap IS NOT NULL
        ORDER BY user_id, calculated_at DESC
      ) latest_gaps
    `

    const phenotypeDistribution: Record<string, number> = {}
    phenotypeResult.rows.forEach(row => {
      phenotypeDistribution[row.primary_phenotype] = parseInt(row.count, 10)
    })

    const successfulCount = parseInt(successResult.rows[0]?.successful || '0', 10)
    const totalCount = parseInt(successResult.rows[0]?.total || '1', 10)

    return {
      totalUsers: parseInt(usersResult.rows[0]?.count || '0', 10),
      totalProtocols: parseInt(protocolsResult.rows[0]?.count || '0', 10),
      totalBiomarkerEntries: parseInt(biomarkersResult.rows[0]?.count || '0', 10),
      avgResilienceScore: parseFloat(avgScoreResult.rows[0]?.avg_score || '0'),
      phenotypeDistribution,
      protocolSuccessRate: totalCount > 0 ? (successfulCount / totalCount) * 100 : 0,
      avgAgeGap: parseFloat(ageGapResult.rows[0]?.avg_gap || '0'),
    }
  } catch (error) {
    console.error('Database error fetching cohort analytics:', error)
    throw new DatabaseError('Failed to fetch cohort analytics', error)
  }
}

// ===========================================
// QR SCAN ANALYTICS
// ===========================================

export interface QrScanStats {
  totalScans: number
  uniqueVisitors: number
  byDestination: Record<string, number>
  bySource: Record<string, number>
  byDevice: Record<string, number>
  byOs: Record<string, number>
  byBrowser: Record<string, number>
  byCity: { city: string; region: string; country: string; count: number }[]
  scansByDay: { date: string; count: number }[]
  recentScans: {
    scan_id: string
    source: string
    destination: string
    device_type: string
    os: string
    browser: string
    city: string | null
    region: string | null
    country: string | null
    created_at: string
  }[]
}

export async function getQrScanStats(days: number = 30): Promise<QrScanStats> {
  try {
    const [
      totalsResult,
      byDestResult,
      bySourceResult,
      byDeviceResult,
      byOsResult,
      byBrowserResult,
      byCityResult,
      byDayResult,
      recentResult,
    ] = await Promise.all([
      // Total scans + unique visitors
      sql`
        SELECT
          COUNT(*) as total_scans,
          COUNT(DISTINCT ip_hash) as unique_visitors
        FROM qr_scans
        WHERE created_at >= NOW() - make_interval(days => ${days})
      `,
      // By destination
      sql`
        SELECT destination, COUNT(*) as count
        FROM qr_scans
        WHERE created_at >= NOW() - make_interval(days => ${days})
        GROUP BY destination ORDER BY count DESC
      `,
      // By source
      sql`
        SELECT source, COUNT(*) as count
        FROM qr_scans
        WHERE created_at >= NOW() - make_interval(days => ${days})
        GROUP BY source ORDER BY count DESC
      `,
      // By device type
      sql`
        SELECT device_type, COUNT(*) as count
        FROM qr_scans
        WHERE created_at >= NOW() - make_interval(days => ${days})
        GROUP BY device_type ORDER BY count DESC
      `,
      // By OS
      sql`
        SELECT os, COUNT(*) as count
        FROM qr_scans
        WHERE created_at >= NOW() - make_interval(days => ${days})
        GROUP BY os ORDER BY count DESC
      `,
      // By browser
      sql`
        SELECT browser, COUNT(*) as count
        FROM qr_scans
        WHERE created_at >= NOW() - make_interval(days => ${days})
        GROUP BY browser ORDER BY count DESC
      `,
      // Top cities
      sql`
        SELECT city, region, country, COUNT(*) as count
        FROM qr_scans
        WHERE created_at >= NOW() - make_interval(days => ${days})
          AND city IS NOT NULL AND city != ''
        GROUP BY city, region, country
        ORDER BY count DESC
        LIMIT 10
      `,
      // Scans by day (for chart)
      sql`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM qr_scans
        WHERE created_at >= NOW() - make_interval(days => ${days})
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
      // Recent scans
      sql`
        SELECT scan_id, source, destination, device_type, os, browser, city, region, country, created_at
        FROM qr_scans
        WHERE created_at >= NOW() - make_interval(days => ${days})
        ORDER BY created_at DESC
        LIMIT 20
      `,
    ])

    const toRecord = (rows: { [key: string]: string | number }[], keyField: string): Record<string, number> => {
      const result: Record<string, number> = {}
      for (const row of rows) {
        result[String(row[keyField])] = Number(row.count)
      }
      return result
    }

    return {
      totalScans: parseInt(totalsResult.rows[0]?.total_scans || '0', 10),
      uniqueVisitors: parseInt(totalsResult.rows[0]?.unique_visitors || '0', 10),
      byDestination: toRecord(byDestResult.rows, 'destination'),
      bySource: toRecord(bySourceResult.rows, 'source'),
      byDevice: toRecord(byDeviceResult.rows, 'device_type'),
      byOs: toRecord(byOsResult.rows, 'os'),
      byBrowser: toRecord(byBrowserResult.rows, 'browser'),
      byCity: byCityResult.rows.map(r => ({
        city: String(r.city),
        region: String(r.region || ''),
        country: String(r.country || ''),
        count: Number(r.count),
      })),
      scansByDay: byDayResult.rows.map(r => ({
        date: String(r.date),
        count: Number(r.count),
      })),
      recentScans: recentResult.rows.map(r => ({
        scan_id: String(r.scan_id),
        source: String(r.source),
        destination: String(r.destination),
        device_type: String(r.device_type),
        os: String(r.os),
        browser: String(r.browser),
        city: r.city ? String(r.city) : null,
        region: r.region ? String(r.region) : null,
        country: r.country ? String(r.country) : null,
        created_at: String(r.created_at),
      })),
    }
  } catch (error) {
    console.error('Database error fetching QR scan stats:', error)
    throw new DatabaseError('Failed to fetch QR scan stats', error)
  }
}

// ===========================================
// REVENUE TIME SERIES
// ===========================================

export interface RevenueTimeSeriesPoint {
  date: string
  revenue: number
  orders: number
}

export async function getRevenueTimeSeries(days = 30): Promise<RevenueTimeSeriesPoint[]> {
  try {
    // Query both tables in parallel (no UNION ALL — @vercel/postgres compatibility)
    // date_trunc requires a literal string — separate queries per bucket size
    let clubQuery, ordersQuery

    if (days <= 30) {
      clubQuery = sql`
        SELECT created_at::date as date, COALESCE(SUM(subtotal_usd), 0) as revenue, COUNT(*)::int as orders
        FROM club_orders
        WHERE status IN ('invoice_sent', 'paid')
          AND created_at >= NOW() - make_interval(days => ${days})
        GROUP BY created_at::date
      `
      ordersQuery = sql`
        SELECT created_at::date as date, COALESCE(SUM(total_amount), 0) as revenue, COUNT(*)::int as orders
        FROM orders
        WHERE status IS DISTINCT FROM 'cancelled' AND status IS DISTINCT FROM 'refunded'
          AND created_at >= NOW() - make_interval(days => ${days})
        GROUP BY created_at::date
      `
    } else if (days <= 90) {
      clubQuery = sql`
        SELECT date_trunc('week', created_at)::date as date, COALESCE(SUM(subtotal_usd), 0) as revenue, COUNT(*)::int as orders
        FROM club_orders
        WHERE status IN ('invoice_sent', 'paid')
          AND created_at >= NOW() - make_interval(days => ${days})
        GROUP BY date_trunc('week', created_at)::date
      `
      ordersQuery = sql`
        SELECT date_trunc('week', created_at)::date as date, COALESCE(SUM(total_amount), 0) as revenue, COUNT(*)::int as orders
        FROM orders
        WHERE status IS DISTINCT FROM 'cancelled' AND status IS DISTINCT FROM 'refunded'
          AND created_at >= NOW() - make_interval(days => ${days})
        GROUP BY date_trunc('week', created_at)::date
      `
    } else {
      clubQuery = sql`
        SELECT date_trunc('month', created_at)::date as date, COALESCE(SUM(subtotal_usd), 0) as revenue, COUNT(*)::int as orders
        FROM club_orders
        WHERE status IN ('invoice_sent', 'paid')
          AND created_at >= NOW() - make_interval(days => ${days})
        GROUP BY date_trunc('month', created_at)::date
      `
      ordersQuery = sql`
        SELECT date_trunc('month', created_at)::date as date, COALESCE(SUM(total_amount), 0) as revenue, COUNT(*)::int as orders
        FROM orders
        WHERE status IS DISTINCT FROM 'cancelled' AND status IS DISTINCT FROM 'refunded'
          AND created_at >= NOW() - make_interval(days => ${days})
        GROUP BY date_trunc('month', created_at)::date
      `
    }

    const [clubResult, ordersResult] = await Promise.all([clubQuery, ordersQuery.catch(() => ({ rows: [] }))])

    // Merge both result sets by date bucket
    const merged = new Map<string, { revenue: number; orders: number }>()
    for (const r of [...clubResult.rows, ...ordersResult.rows]) {
      // @vercel/postgres returns date columns as JS Date objects — normalize to YYYY-MM-DD
      const key = new Date(r.date).toISOString().slice(0, 10)
      const existing = merged.get(key) || { revenue: 0, orders: 0 }
      existing.revenue += parseFloat(r.revenue) || 0
      existing.orders += parseInt(r.orders, 10) || 0
      merged.set(key, existing)
    }

    return Array.from(merged.entries())
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([date, data]) => ({ date, revenue: data.revenue, orders: data.orders }))
  } catch (error) {
    console.error('Database error fetching revenue time series:', error)
    throw new DatabaseError('Failed to fetch revenue time series', error)
  }
}

// ===========================================
// ORDER SEARCH WITH PAGINATION
// ===========================================

export interface SearchOrdersParams {
  query?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export interface SearchOrdersResult {
  orders: {
    id: string
    order_number: string
    customer_email: string
    customer_name: string | null
    status: string
    total_amount: number
    created_at: string
    source: 'orders' | 'club_orders'
    items: OrderItem[]
    coupon_code: string | null
  }[]
  total: number
  page: number
  totalPages: number
}

export async function searchOrders({
  query,
  status,
  dateFrom,
  dateTo,
  page = 1,
  limit = 20,
}: SearchOrdersParams): Promise<SearchOrdersResult> {
  try {
    const searchPattern = query ? `%${query}%` : '%'
    const statusFilter = status || '%'

    // Query both tables separately then merge
    // Use ILIKE with '%' as wildcard-all instead of IS NULL checks (more compatible with @vercel/postgres)
    const [shopResult, clubResult] = await Promise.all([
      sql`
        SELECT id::text as id, order_number, customer_email, NULL::text as customer_name, status,
          COALESCE(total_amount, 0)::numeric as total_amount, created_at, items::text as items_raw,
          ''::text as coupon_code
        FROM orders
        WHERE (order_number ILIKE ${searchPattern} OR customer_email ILIKE ${searchPattern})
        AND COALESCE(status, '') ILIKE ${statusFilter}
        ORDER BY created_at DESC
      `.catch(() => ({ rows: [] })),
      sql`
        SELECT id::text as id, order_number, member_email as customer_email, member_name as customer_name, status,
          COALESCE(subtotal_usd, 0)::numeric as total_amount, created_at, items::text as items_raw,
          COALESCE(coupon_code, '') as coupon_code
        FROM club_orders
        WHERE (order_number ILIKE ${searchPattern} OR member_email ILIKE ${searchPattern}
          OR member_name ILIKE ${searchPattern})
        AND COALESCE(status, '') ILIKE ${statusFilter}
        ORDER BY created_at DESC
      `.catch(() => ({ rows: [] })),
    ])

    // Merge, sort, and paginate in JS
    const allRows = [
      ...shopResult.rows.map(r => ({ ...r, source: 'orders' as const })),
      ...clubResult.rows.map(r => ({ ...r, source: 'club_orders' as const })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const total = allRows.length
    const totalPages = Math.ceil(total / limit)
    const offset = (page - 1) * limit
    const pageRows = allRows.slice(offset, offset + limit)

    const orders = pageRows.map(row => {
      let items: OrderItem[] = []
      try {
        const parsed = typeof row.items_raw === 'string' ? JSON.parse(row.items_raw) : row.items_raw
        if (Array.isArray(parsed)) items = parsed
      } catch {
        // items may not be valid JSON for some rows
      }

      return {
        id: row.id,
        order_number: row.order_number,
        customer_email: row.customer_email,
        customer_name: row.customer_name ?? null,
        status: row.status,
        total_amount: parseFloat(row.total_amount) || 0,
        created_at: String(row.created_at),
        source: row.source,
        items,
        coupon_code: row.coupon_code || null,
      }
    })

    return { orders, total, page, totalPages }
  } catch (error) {
    console.error('Database error searching orders:', error)
    throw new DatabaseError('Failed to search orders', error)
  }
}

// ===========================================
// CUSTOMER FULL PROFILE
// ===========================================

export interface CustomerFullProfile {
  member: {
    id: string
    name: string
    email: string
    phone: string | null
    address_street: string | null
    address_city: string | null
    address_state: string | null
    address_zip: string | null
    age: number | null
    gender: string | null
    signup_type: string | null
    source: string | null
    created_at: string
  } | null
  clubOrders: {
    id: string
    order_number: string
    status: string
    subtotal_usd: number | null
    items: unknown
    coupon_code: string | null
    created_at: string
  }[]
  productOrders: {
    id: string
    order_number: string
    status: string
    total_amount: number
    items: unknown
    created_at: string
  }[]
  membership: {
    plan_tier: string
    subscription_status: string
    created_at: string
  } | null
  intakeStatus: {
    intake_status: string
    plan_tier: string
    created_at: string
  } | null
  quizResponses: {
    id: number
    session_id: string
    recommended_tier: string
    recommended_therapy: string | null
    answers: Record<string, string | string[]>
    clicked_join: boolean
    lead_captured_at: string | null
    completed_at: string
  }[]
  lifetimeValue: number
  totalOrders: number
}

export async function getCustomerFullProfile(email: string): Promise<CustomerFullProfile> {
  try {
    const normalizedEmail = email.toLowerCase()

    // Run queries in parallel — each wrapped in .catch() so one missing table doesn't crash all
    const emptyResult = { rows: [] }
    const [memberResult, clubOrdersResult, productOrdersResult, membershipResult, intakeResult, quizResult] = await Promise.all([
      sql`
        SELECT id, name, email, phone, address_street, address_city, address_state, address_zip, age, gender, signup_type, source, created_at
        FROM club_members
        WHERE LOWER(email) = ${normalizedEmail}
        LIMIT 1
      `.catch(() => emptyResult),
      sql`
        SELECT id, order_number, status, subtotal_usd, items, coupon_code, created_at
        FROM club_orders
        WHERE LOWER(member_email) = ${normalizedEmail}
        ORDER BY created_at DESC
      `.catch(() => emptyResult),
      sql`
        SELECT id, order_number, status, total_amount, items, payment_provider, created_at
        FROM orders
        WHERE LOWER(customer_email) = ${normalizedEmail}
        ORDER BY created_at DESC
      `.catch(() => emptyResult),
      sql`
        SELECT m.plan_tier, m.subscription_status, m.created_at
        FROM memberships m
        INNER JOIN orders o ON m.stripe_customer_id = o.stripe_customer_id
        WHERE LOWER(o.customer_email) = ${normalizedEmail}
        ORDER BY m.created_at DESC
        LIMIT 1
      `.catch(() => emptyResult),
      sql`
        SELECT intake_status, plan_tier, created_at
        FROM pending_intakes
        WHERE LOWER(customer_email) = ${normalizedEmail}
        ORDER BY created_at DESC
        LIMIT 1
      `.catch(() => emptyResult),
      sql`
        SELECT id, session_id, answers, recommended_tier, recommended_therapy,
               clicked_join, lead_captured_at, completed_at
        FROM quiz_responses
        WHERE LOWER(lead_email) = ${normalizedEmail}
        ORDER BY completed_at DESC
      `.catch(() => emptyResult),
    ])

    const member = memberResult.rows[0] ? {
      id: String(memberResult.rows[0].id),
      name: String(memberResult.rows[0].name),
      email: String(memberResult.rows[0].email),
      phone: memberResult.rows[0].phone ? String(memberResult.rows[0].phone) : null,
      address_street: memberResult.rows[0].address_street ? String(memberResult.rows[0].address_street) : null,
      address_city: memberResult.rows[0].address_city ? String(memberResult.rows[0].address_city) : null,
      address_state: memberResult.rows[0].address_state ? String(memberResult.rows[0].address_state) : null,
      address_zip: memberResult.rows[0].address_zip ? String(memberResult.rows[0].address_zip) : null,
      age: memberResult.rows[0].age !== null && memberResult.rows[0].age !== undefined ? Number(memberResult.rows[0].age) : null,
      gender: memberResult.rows[0].gender ? String(memberResult.rows[0].gender) : null,
      signup_type: memberResult.rows[0].signup_type ? String(memberResult.rows[0].signup_type) : null,
      source: memberResult.rows[0].source ? String(memberResult.rows[0].source) : null,
      created_at: String(memberResult.rows[0].created_at),
    } : null

    const clubOrders = clubOrdersResult.rows.map(r => ({
      id: String(r.id),
      order_number: String(r.order_number),
      status: String(r.status),
      subtotal_usd: r.subtotal_usd ? parseFloat(r.subtotal_usd) : null,
      items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items,
      coupon_code: r.coupon_code ? String(r.coupon_code) : null,
      created_at: String(r.created_at),
    }))

    const productOrders = productOrdersResult.rows.map(r => ({
      id: String(r.id),
      order_number: String(r.order_number),
      status: String(r.status),
      total_amount: parseFloat(r.total_amount) || 0,
      items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items,
      payment_provider: r.payment_provider ? String(r.payment_provider) : null,
      created_at: String(r.created_at),
    }))

    const membership = membershipResult.rows[0] ? {
      plan_tier: String(membershipResult.rows[0].plan_tier),
      subscription_status: String(membershipResult.rows[0].subscription_status),
      created_at: String(membershipResult.rows[0].created_at),
    } : null

    const intakeStatus = intakeResult.rows[0] ? {
      intake_status: String(intakeResult.rows[0].intake_status),
      plan_tier: String(intakeResult.rows[0].plan_tier),
      created_at: String(intakeResult.rows[0].created_at),
    } : null

    const quizResponses = quizResult.rows.map(r => ({
      id: Number(r.id),
      session_id: String(r.session_id),
      answers: typeof r.answers === 'string' ? JSON.parse(r.answers) : (r.answers ?? {}),
      recommended_tier: String(r.recommended_tier),
      recommended_therapy: r.recommended_therapy ? String(r.recommended_therapy) : null,
      clicked_join: Boolean(r.clicked_join),
      lead_captured_at: r.lead_captured_at ? String(r.lead_captured_at) : null,
      completed_at: String(r.completed_at),
    }))

    // Calculate lifetime value from all orders
    const clubTotal = clubOrders.reduce((sum, o) => sum + (o.subtotal_usd || 0), 0)
    const productTotal = productOrders.reduce((sum, o) => sum + o.total_amount, 0)

    return {
      member,
      clubOrders,
      productOrders,
      membership,
      intakeStatus,
      quizResponses,
      lifetimeValue: clubTotal + productTotal,
      totalOrders: clubOrders.length + productOrders.length,
    }
  } catch (error) {
    console.error('Database error fetching customer full profile:', error)
    throw new DatabaseError('Failed to fetch customer profile', error)
  }
}

// ===========================================
// UPDATE CLUB MEMBER (admin edit)
// ===========================================

export interface ClubMemberPatch {
  name?: string
  phone?: string | null
  address_street?: string | null
  address_city?: string | null
  address_state?: string | null
  address_zip?: string | null
  age?: number | null
  gender?: string | null
  signup_type?: string | null
  source?: string | null
}

/**
 * Update a `club_members` row by email, using COALESCE semantics so only
 * explicitly-provided fields change. Fields passed as `undefined` are ignored;
 * fields passed as `null` are coerced to null via `NULLIF` of a sentinel
 * (not needed here because we pass literal null).
 *
 * NOTE: COALESCE replaces NULL params with the existing column, which means
 * callers cannot use this helper to set a field to NULL. For this MVP that is
 * acceptable — admins edit via text inputs and empty strings map to existing
 * value preservation. If we later need to null out fields, switch to an
 * "undefined vs null" discriminator and build the UPDATE dynamically.
 */
export async function updateClubMemberByEmail(
  email: string,
  patch: ClubMemberPatch
): Promise<{ id: string } | null> {
  try {
    const normalized = email.toLowerCase()

    // Map undefined → null so @vercel/postgres interpolates DB NULL and COALESCE
    // falls back to the existing column value (i.e. "no change for this field").
    const name = patch.name ?? null
    const phone = patch.phone ?? null
    const address_street = patch.address_street ?? null
    const address_city = patch.address_city ?? null
    const address_state = patch.address_state ?? null
    const address_zip = patch.address_zip ?? null
    const age = patch.age ?? null
    const gender = patch.gender ?? null
    const signup_type = patch.signup_type ?? null
    const source = patch.source ?? null

    const result = await sql`
      UPDATE club_members
      SET
        name = COALESCE(${name}, name),
        phone = COALESCE(${phone}, phone),
        address_street = COALESCE(${address_street}, address_street),
        address_city = COALESCE(${address_city}, address_city),
        address_state = COALESCE(${address_state}, address_state),
        address_zip = COALESCE(${address_zip}, address_zip),
        age = COALESCE(${age}, age),
        gender = COALESCE(${gender}, gender),
        signup_type = COALESCE(${signup_type}, signup_type),
        source = COALESCE(${source}, source),
        updated_at = NOW()
      WHERE LOWER(email) = ${normalized}
      RETURNING id
    `

    if (result.rows.length === 0) return null
    return { id: String(result.rows[0].id) }
  } catch (error) {
    console.error('Database error updating club member:', error)
    throw new DatabaseError('Failed to update club member', error)
  }
}

/**
 * Check if a club member has orders before deletion.
 * Returns { hasOrders, orderCount }.
 */
export async function getClubMemberOrderCount(email: string): Promise<{ hasOrders: boolean; orderCount: number }> {
  try {
    const normalized = email.toLowerCase()
    const result = await sql`
      SELECT COUNT(*)::integer AS count FROM club_orders WHERE LOWER(member_email) = ${normalized}
    `
    const count = Number(result.rows[0]?.count ?? 0)
    return { hasOrders: count > 0, orderCount: count }
  } catch (error) {
    console.error('Database error checking club member order count:', error)
    throw new DatabaseError('Failed to check club member order count', error)
  }
}

/**
 * Delete a club_members row by email.
 * If the member has orders the FK constraint prevents deletion, so we check
 * first and return a blockedByOrders count instead of throwing.
 */
export async function deleteClubMemberByEmail(
  email: string,
  force?: boolean
): Promise<{ deleted: boolean; id: string | null; orderCount?: number }> {
  try {
    const normalized = email.toLowerCase()

    const { hasOrders, orderCount } = await getClubMemberOrderCount(email)
    if (hasOrders && !force) {
      return { deleted: false, id: null, orderCount }
    }

    const result = await sql`
      DELETE FROM club_members WHERE LOWER(email) = ${normalized} RETURNING id
    `
    if (result.rows.length === 0) {
      return { deleted: false, id: null }
    }
    return { deleted: true, id: String(result.rows[0].id), orderCount }
  } catch (error) {
    console.error('Database error deleting club member:', error)
    throw new DatabaseError('Failed to delete club member', error)
  }
}

/**
 * Delete a memberships row by stripe_customer_id.
 * Does NOT cancel the Stripe subscription -- caller must handle Stripe first
 * if needed.
 */
export async function deleteMembershipByCustomerId(customerId: string): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM memberships WHERE stripe_customer_id = ${customerId} RETURNING id
    `
    return (result.rowCount ?? 0) > 0
  } catch (error) {
    console.error('Database error deleting membership:', error)
    throw new DatabaseError('Failed to delete membership', error)
  }
}

// ===========================================
// MEMBER LIFECYCLE MANAGEMENT
// ===========================================

export interface MembershipAdminRow {
  id: string
  email: string
  stripe_customer_id: string
  stripe_subscription_id: string
  plan_tier: string
  subscription_status: string
  created_at: string
  updated_at: string
  cancelled_at: string | null
  cancellation_reason: string | null
}

/**
 * Get all memberships for admin management.
 * Returns all rows from the memberships table, ordered by most recent first.
 */
export async function getAllMembershipsForAdmin(): Promise<MembershipAdminRow[]> {
  try {
    const [membershipsResult, clubMembersResult] = await Promise.all([
      sql`
        SELECT
          id,
          email,
          stripe_customer_id,
          stripe_subscription_id,
          plan_tier,
          subscription_status,
          created_at,
          updated_at,
          cancelled_at,
          cancellation_reason
        FROM memberships
      `.catch(() => ({ rows: [] })),
      sql`
        SELECT
          id,
          email,
          'club_' || id::text as stripe_customer_id,
          NULL as stripe_subscription_id,
          'club' as plan_tier,
          'active' as subscription_status,
          created_at,
          updated_at,
          NULL as cancelled_at,
          NULL as cancellation_reason
        FROM club_members
      `.catch(() => ({ rows: [] }))
    ])

    const allRows = [
      ...membershipsResult.rows,
      ...clubMembersResult.rows
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return allRows as MembershipAdminRow[]
  } catch (error) {
    console.error('Database error fetching all memberships:', error)
    throw new DatabaseError('Failed to fetch memberships for admin', error)
  }
}

export interface MemberDetailRow {
  id: string
  stripe_customer_id: string
  stripe_subscription_id: string
  plan_tier: string
  subscription_status: string
  created_at: string
  updated_at: string
  cancelled_at: string | null
  cancellation_reason: string | null
}

/**
 * Get full member details by Stripe customer ID.
 */
export async function getMemberDetails(customerId: string): Promise<MemberDetailRow | null> {
  try {
    const result = await sql`
      SELECT * FROM memberships
      WHERE stripe_customer_id = ${customerId}
      ORDER BY created_at DESC
      LIMIT 1
    `
    return (result.rows[0] as MemberDetailRow) || null
  } catch (error) {
    console.error('Database error fetching member details:', error)
    throw new DatabaseError('Failed to fetch member details', error)
  }
}

/**
 * Log an admin action to the admin_actions audit table.
 * Non-throwing: audit logging should never break the calling flow.
 */
export async function logAdminAction(
  action: string,
  targetId: string,
  details: Record<string, unknown>,
  adminEmail: string
): Promise<void> {
  try {
    await sql`
      INSERT INTO admin_actions (admin_email, action_type, entity_type, entity_id, reason, metadata)
      VALUES (
        ${adminEmail},
        ${action},
        ${'membership'},
        ${targetId},
        ${(details.reason as string) || null},
        ${JSON.stringify(details)}
      )
    `
  } catch (error) {
    console.error('Database error logging admin action:', error)
    // Don't throw - audit logging shouldn't break flows
  }
}

// ─── Club Order Fulfillment ─────────────────────────────

export interface ClubOrderPipelineAuditSummary {
  totalIssues: number
  totalActive: number
  terminalOrders: number
  awaitingApproval: number
  needsPayment: number
  readyToShip: number
  shippedNotFulfilled: number
  checks: {
    staleActiveOrders: number
    missingRequiredTimestamps: number
    shippedMissingTracking: number
    timestampOrderIssues: number
    invalidStatuses: number
  }
}

/**
 * Get club order fulfillment counts by status for pipeline visualization.
 */
export async function getClubOrderFulfillmentCounts(): Promise<Record<string, number>> {
  try {
    const result = await sql`
      SELECT status, COUNT(*)::int as count
      FROM club_orders
      GROUP BY status
    `
    const counts: Record<string, number> = {}
    result.rows.forEach(row => {
      counts[row.status] = row.count
    })
    return counts
  } catch (error) {
    console.error('Database error fetching fulfillment counts:', error)
    throw new DatabaseError('Failed to fetch fulfillment counts', error)
  }
}

/**
 * Count club-order pipeline cleanup risks without returning customer details.
 */
export async function getClubOrderPipelineAuditSummary(): Promise<ClubOrderPipelineAuditSummary> {
  try {
    const result = await sql`
      SELECT
        COUNT(*) FILTER (
          WHERE status NOT IN ('fulfilled', 'cancelled', 'rejected', 'dismissed')
        )::int AS total_active,
        COUNT(*) FILTER (
          WHERE status IN ('fulfilled', 'cancelled', 'rejected', 'dismissed')
        )::int AS terminal_orders,
        COUNT(*) FILTER (WHERE status = 'pending_approval')::int AS awaiting_approval,
        COUNT(*) FILTER (WHERE status IN ('invoice_sent', 'needs_payment'))::int AS needs_payment,
        COUNT(*) FILTER (WHERE status IN ('paid', 'waiting_to_ship'))::int AS ready_to_ship,
        COUNT(*) FILTER (WHERE status = 'shipped')::int AS shipped_not_fulfilled,
        COUNT(*) FILTER (
          WHERE status NOT IN ('fulfilled', 'cancelled', 'rejected', 'dismissed')
            AND COALESCE(updated_at, created_at) < NOW() - INTERVAL '48 hours'
        )::int AS stale_active_orders,
        COUNT(*) FILTER (
          WHERE (
            status IN ('approved', 'invoice_sent', 'needs_payment', 'paid', 'waiting_to_ship', 'shipped', 'fulfilled')
            AND approved_at IS NULL
          ) OR (
            status IN ('invoice_sent', 'needs_payment', 'paid', 'waiting_to_ship', 'shipped', 'fulfilled')
            AND invoice_sent_at IS NULL
          ) OR (
            status IN ('paid', 'waiting_to_ship', 'shipped', 'fulfilled')
            AND paid_at IS NULL
          ) OR (
            status IN ('shipped', 'fulfilled')
            AND shipped_at IS NULL
          ) OR (
            status = 'fulfilled'
            AND fulfilled_at IS NULL
          )
        )::int AS missing_required_timestamps,
        COUNT(*) FILTER (
          WHERE status = 'shipped'
            AND (
              tracking_carrier IS NULL OR tracking_carrier = ''
              OR tracking_number IS NULL OR tracking_number = ''
            )
        )::int AS shipped_missing_tracking,
        COUNT(*) FILTER (
          WHERE (
            approved_at IS NOT NULL
            AND invoice_sent_at IS NOT NULL
            AND invoice_sent_at < approved_at
          ) OR (
            paid_at IS NOT NULL
            AND COALESCE(invoice_sent_at, approved_at) IS NOT NULL
            AND paid_at < COALESCE(invoice_sent_at, approved_at)
          ) OR (
            shipped_at IS NOT NULL
            AND paid_at IS NOT NULL
            AND shipped_at < paid_at
          ) OR (
            fulfilled_at IS NOT NULL
            AND shipped_at IS NOT NULL
            AND fulfilled_at < shipped_at
          )
        )::int AS timestamp_order_issues,
        COUNT(*) FILTER (
          WHERE status NOT IN (
            'pending_approval', 'approved', 'invoice_sent', 'needs_payment',
            'paid', 'waiting_to_ship', 'shipped', 'fulfilled',
            'cancelled', 'rejected', 'dismissed'
          )
        )::int AS invalid_statuses
      FROM club_orders
    `

    const row = result.rows[0] || {}
    const checks = {
      staleActiveOrders: parseInt(row.stale_active_orders || '0', 10),
      missingRequiredTimestamps: parseInt(row.missing_required_timestamps || '0', 10),
      shippedMissingTracking: parseInt(row.shipped_missing_tracking || '0', 10),
      timestampOrderIssues: parseInt(row.timestamp_order_issues || '0', 10),
      invalidStatuses: parseInt(row.invalid_statuses || '0', 10),
    }

    return {
      totalIssues: Object.values(checks).reduce((sum, count) => sum + count, 0),
      totalActive: parseInt(row.total_active || '0', 10),
      terminalOrders: parseInt(row.terminal_orders || '0', 10),
      awaitingApproval: parseInt(row.awaiting_approval || '0', 10),
      needsPayment: parseInt(row.needs_payment || '0', 10),
      readyToShip: parseInt(row.ready_to_ship || '0', 10),
      shippedNotFulfilled: parseInt(row.shipped_not_fulfilled || '0', 10),
      checks,
    }
  } catch (error) {
    console.error('Database error fetching club order pipeline audit summary:', error)
    throw new DatabaseError('Failed to fetch club order pipeline audit summary', error)
  }
}

/**
 * Get inventory items that are low_stock, out_of_stock, or restocking_soon for dashboard alerts.
 */
export async function getInventoryAlerts(): Promise<{
  therapyId: string
  therapyName: string
  stockStatus: 'low_stock' | 'out_of_stock' | 'restocking_soon'
  stockQuantity: number | null
  updatedAt: string
  siteSource: string
}[]> {
  try {
    const result = await sql`
      SELECT therapy_id, therapy_name, stock_status, stock_quantity, updated_at,
             COALESCE(site_source, 'join_cultrhealth') AS site_source
      FROM product_inventory
      WHERE stock_status IN ('low_stock', 'out_of_stock', 'restocking_soon')
      ORDER BY
        CASE stock_status WHEN 'out_of_stock' THEN 0 WHEN 'restocking_soon' THEN 1 ELSE 2 END,
        stock_quantity ASC NULLS LAST
    `
    return result.rows.map(r => ({
      therapyId: r.therapy_id,
      therapyName: r.therapy_name,
      stockStatus: r.stock_status as 'low_stock' | 'out_of_stock' | 'restocking_soon',
      stockQuantity: r.stock_quantity != null ? Number(r.stock_quantity) : null,
      updatedAt: r.updated_at,
      siteSource: r.site_source,
    }))
  } catch (error) {
    console.error('Database error fetching inventory alerts:', error)
    throw new DatabaseError('Failed to fetch inventory alerts', error)
  }
}

export async function getQuizLeads(days = 90) {
  try {
    const result = await sql`
      SELECT id, session_id, recommended_tier, recommended_therapy,
             lead_first_name, lead_last_name, lead_email, lead_phone,
             clicked_join, lead_captured_at, completed_at
      FROM quiz_responses
      WHERE completed_at >= NOW() - make_interval(days => ${days})
      ORDER BY completed_at DESC
      LIMIT 200
    `
    return result.rows.map(r => ({
      id: Number(r.id),
      session_id: r.session_id as string,
      recommended_tier: r.recommended_tier as string,
      recommended_therapy: r.recommended_therapy as string | null,
      lead_first_name: r.lead_first_name as string | null,
      lead_last_name: r.lead_last_name as string | null,
      lead_email: r.lead_email as string | null,
      lead_phone: r.lead_phone as string | null,
      clicked_join: Boolean(r.clicked_join),
      lead_captured_at: r.lead_captured_at as string | null,
      completed_at: r.completed_at as string,
    }))
  } catch (error) {
    console.error('Database error fetching quiz leads:', error)
    return []
  }
}

export async function getClubMembersForAdmin() {
  try {
    const result = await sql`
      SELECT id, name, email, phone, social_handle,
             address_city, address_state, signup_type,
             coupon_code, source, created_at
      FROM club_members
      ORDER BY created_at DESC
      LIMIT 500
    `
    return result.rows.map(r => ({
      id: r.id as string,
      name: r.name as string,
      email: r.email as string,
      phone: r.phone as string | null,
      social_handle: r.social_handle as string | null,
      address_city: r.address_city as string | null,
      address_state: r.address_state as string | null,
      signup_type: r.signup_type as string | null,
      coupon_code: r.coupon_code as string | null,
      source: r.source as string | null,
      created_at: r.created_at as string,
    }))
  } catch (error) {
    console.error('Database error fetching club members for admin:', error)
    return []
  }
}

export async function getClubSiteFunnel(days = 30) {
  try {
    const [funnelResult, pagesResult] = await Promise.all([
      sql`
        SELECT
          COUNT(DISTINCT session_id)::integer                                                          AS total_sessions,
          COUNT(DISTINCT CASE WHEN event_type = 'page_view'       THEN session_id END)::integer       AS page_view_sessions,
          COUNT(DISTINCT CASE WHEN event_type = 'signup'          THEN session_id END)::integer       AS signup_sessions,
          COUNT(DISTINCT CASE WHEN event_type = 'begin_checkout'  THEN session_id END)::integer       AS checkout_sessions,
          COUNT(DISTINCT CASE WHEN event_type = 'order_submitted' THEN session_id END)::integer       AS order_sessions
        FROM visitor_events
        WHERE created_at >= NOW() - make_interval(days => ${days})
      `,
      sql`
        SELECT
          SPLIT_PART(page_url, '?', 1) AS page,
          COUNT(*)::integer            AS views
        FROM visitor_events
        WHERE event_type = 'page_view'
          AND page_url IS NOT NULL
          AND created_at >= NOW() - make_interval(days => ${days})
        GROUP BY 1
        ORDER BY views DESC
        LIMIT 8
      `,
    ])

    const r = funnelResult.rows[0]
    return {
      totalSessions:    Number(r?.total_sessions)    || 0,
      pageViewSessions: Number(r?.page_view_sessions) || 0,
      signupSessions:   Number(r?.signup_sessions)   || 0,
      checkoutSessions: Number(r?.checkout_sessions) || 0,
      orderSessions:    Number(r?.order_sessions)    || 0,
      topPages: pagesResult.rows.map(p => ({
        page:  p.page  as string,
        views: Number(p.views),
      })),
    }
  } catch (error) {
    console.error('Database error fetching club site funnel:', error)
    return {
      totalSessions: 0, pageViewSessions: 0, signupSessions: 0,
      checkoutSessions: 0, orderSessions: 0, topPages: [],
    }
  }
}
