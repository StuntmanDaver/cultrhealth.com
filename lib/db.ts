import { sql } from '@vercel/postgres'

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
}

export interface MembershipEntry {
  id: string
  stripe_customer_id: string
  stripe_subscription_id: string
  plan_tier: string
  subscription_status: string
  asher_patient_id?: number | string
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
  const { name, email, phone, social_handle, treatment_reason, source } = input

  try {
    // Ensure table and index exist
    await ensureWaitlistTable()

    // Upsert: insert or update if email already exists
    const result = await sql`
      INSERT INTO waitlist (name, email, phone, social_handle, treatment_reason, source, status, created_at, updated_at)
      VALUES (${name}, ${email.toLowerCase()}, ${phone}, ${social_handle || null}, ${treatment_reason || null}, ${source || null}, 'new', NOW(), NOW())
      ON CONFLICT (lower(email))
      DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        social_handle = EXCLUDED.social_handle,
        treatment_reason = EXCLUDED.treatment_reason,
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
        status TEXT NOT NULL DEFAULT 'new',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `
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
  const { stripe_customer_id, stripe_subscription_id, plan_tier, subscription_status, asher_patient_id } = input

  try {
    const result = await sql`
      INSERT INTO memberships (
        stripe_customer_id,
        stripe_subscription_id,
        plan_tier,
        subscription_status,
        asher_patient_id,
        created_at,
        updated_at
      )
      VALUES (
        ${stripe_customer_id},
        ${stripe_subscription_id},
        ${plan_tier},
        ${subscription_status},
        ${asher_patient_id || null},
        NOW(),
        NOW()
      )
      ON CONFLICT (stripe_subscription_id)
      DO UPDATE SET
        subscription_status = EXCLUDED.subscription_status,
        plan_tier = EXCLUDED.plan_tier,
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
    const updates: string[] = []
    const values: (string | Date | null)[] = []

    // Build dynamic update query
    if (input.subscription_status !== undefined) {
      updates.push('subscription_status')
      values.push(input.subscription_status)
    }
    if (input.plan_tier !== undefined) {
      updates.push('plan_tier')
      values.push(input.plan_tier)
    }
    if (input.asher_patient_id !== undefined) {
      updates.push('asher_patient_id')
      values.push(String(input.asher_patient_id))
    }
    if (input.cancelled_at !== undefined) {
      updates.push('cancelled_at')
      values.push(input.cancelled_at?.toISOString() || null)
    }
    if (input.cancellation_reason !== undefined) {
      updates.push('cancellation_reason')
      values.push(input.cancellation_reason)
    }

    if (updates.length === 0) {
      return false
    }

    // Use a simpler approach for the update
    const result = await sql`
      UPDATE memberships
      SET 
        subscription_status = COALESCE(${input.subscription_status || null}, subscription_status),
        plan_tier = COALESCE(${input.plan_tier || null}, plan_tier),
        asher_patient_id = COALESCE(${input.asher_patient_id || null}, asher_patient_id),
        cancelled_at = ${input.cancelled_at?.toISOString() || null},
        cancellation_reason = COALESCE(${input.cancellation_reason || null}, cancellation_reason),
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
  payment_provider: 'stripe' | 'klarna' | 'affirm' | 'authorize_net'
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
  payment_provider?: 'stripe' | 'klarna' | 'affirm' | 'authorize_net'
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
    console.error('Database error fetching orders by email:', error)
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
      totalOrders: parseInt(totalsResult.rows[0]?.total_orders || '0', 10),
      totalRevenue: parseFloat(totalsResult.rows[0]?.total_revenue || '0'),
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
      SELECT
        co.coupon_code,
        co.discount_percent,
        co.attributed_creator_id,
        COUNT(*)::int as usage_count,
        COALESCE(SUM(co.subtotal_usd), 0) as total_revenue,
        COALESCE(SUM(
          CASE WHEN co.discount_percent > 0 AND co.discount_percent < 100
          THEN co.subtotal_usd * co.discount_percent / (100.0 - co.discount_percent)
          ELSE 0 END
        ), 0) as total_discount,
        COALESCE(AVG(co.subtotal_usd), 0) as avg_order_value,
        c.full_name as creator_name,
        ac_match.program_type
      FROM club_orders co
      LEFT JOIN creators c ON co.attributed_creator_id = c.id
      LEFT JOIN LATERAL (
        SELECT program_type FROM affiliate_codes
        WHERE UPPER(code) = UPPER(co.coupon_code)
        ORDER BY active DESC, created_at DESC
        LIMIT 1
      ) ac_match ON TRUE
      WHERE co.coupon_code IS NOT NULL
        AND co.coupon_code != ''
        AND co.created_at >= NOW() - INTERVAL '1 day' * ${days}
        AND (ac_match.program_type IS NULL OR ac_match.program_type != 'prelaunch')
      GROUP BY co.coupon_code, co.discount_percent, co.attributed_creator_id, c.full_name, ac_match.program_type
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

export async function getCreatorCommissionStats(days = 30): Promise<CreatorCommissionStats> {
  try {
    const [commissionResult, statusResult] = await Promise.all([
      sql`
        SELECT
          COUNT(DISTINCT CASE WHEN cl.status != 'reversed' THEN cl.beneficiary_creator_id END)::int as active_creators,
          COALESCE(SUM(CASE WHEN cl.status = 'pending' THEN cl.commission_amount ELSE 0 END), 0) as total_pending,
          COALESCE(SUM(CASE WHEN cl.status = 'approved' THEN cl.commission_amount ELSE 0 END), 0) as total_approved,
          COALESCE(SUM(CASE WHEN cl.status = 'paid' THEN cl.commission_amount ELSE 0 END), 0) as total_paid,
          COALESCE(SUM(CASE WHEN cl.status != 'reversed' THEN cl.commission_amount ELSE 0 END), 0) as total_lifetime
        FROM commission_ledger cl
        WHERE cl.created_at >= NOW() - INTERVAL '1 day' * ${days}
      `,
      sql`
        SELECT status, COUNT(*)::int as count FROM creators GROUP BY status
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
    const totalResult = await sql`SELECT COUNT(*) as count FROM memberships WHERE subscription_status = 'active'`

    const tierResult = await sql`
      SELECT plan_tier, COUNT(*) as count
      FROM memberships
      WHERE subscription_status = 'active'
      GROUP BY plan_tier
    `

    const statusResult = await sql`
      SELECT subscription_status, COUNT(*) as count
      FROM memberships
      GROUP BY subscription_status
    `

    const byTier: Record<string, number> = {}
    tierResult.rows.forEach(row => {
      byTier[row.plan_tier] = parseInt(row.count, 10)
    })

    const byStatus: Record<string, number> = {}
    statusResult.rows.forEach(row => {
      byStatus[row.subscription_status] = parseInt(row.count, 10)
    })

    return {
      total: parseInt(totalResult.rows[0]?.count || '0', 10),
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
      SELECT id, order_number, member_name, member_email, subtotal_usd, created_at,
        EXTRACT(DAY FROM NOW() - created_at)::int as days_pending
      FROM club_orders WHERE status = 'pending_approval'
      ORDER BY created_at ASC
    `
    return result.rows
  } catch (error) {
    console.error('Database error fetching invoice aging:', error)
    throw new DatabaseError('Failed to fetch invoice aging', error)
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

export async function getCreatorROI() {
  try {
    const result = await sql`
      SELECT
        c.id, c.full_name, c.status,
        COALESCE(SUM(
          CASE WHEN ac.discount_value > 0 AND ac.discount_value < 100
          THEN ac.total_revenue * ac.discount_value / (100.0 - ac.discount_value)
          ELSE 0 END
        ), 0) as total_discount_given,
        (SELECT COALESCE(SUM(cl.commission_amount), 0) FROM commission_ledger cl WHERE cl.beneficiary_creator_id = c.id AND cl.status != 'reversed') as total_commission_earned
      FROM creators c
      LEFT JOIN affiliate_codes ac ON ac.creator_id = c.id
      WHERE c.status = 'active'
      GROUP BY c.id, c.full_name, c.status
      ORDER BY total_commission_earned DESC
    `
    return result.rows.map(r => ({
      id: r.id,
      fullName: r.full_name,
      totalDiscountGiven: parseFloat(r.total_discount_given || '0'),
      totalCommissionEarned: parseFloat(r.total_commission_earned || '0'),
    }))
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

export async function getAllCreatorsForAdmin() {
  try {
    const result = await sql`
      SELECT
        c.*,
        (SELECT COUNT(*)::int FROM affiliate_codes ac WHERE ac.creator_id = c.id AND ac.active = TRUE) as code_count,
        (SELECT COALESCE(SUM(ac.total_revenue), 0) FROM affiliate_codes ac WHERE ac.creator_id = c.id) as total_code_revenue
      FROM creators c
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
        c.status as creator_status
      FROM tracking_links tl
      LEFT JOIN creators c ON tl.creator_id = c.id
      ORDER BY tl.click_count DESC, tl.created_at DESC
    `
    return result.rows
  } catch (error) {
    console.error('Database error fetching all tracking links:', error)
    throw new DatabaseError('Failed to fetch all tracking links', error)
  }
}

export async function getAllAffiliateCodesForAdmin() {
  try {
    const result = await sql`
      SELECT
        ac.*,
        c.full_name as creator_name,
        c.status as creator_status
      FROM affiliate_codes ac
      LEFT JOIN creators c ON ac.creator_id = c.id
      ORDER BY ac.use_count DESC, ac.created_at DESC
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
        (SELECT COUNT(*)::int FROM club_orders co WHERE co.member_id = cm.id) as order_count,
        (SELECT COALESCE(SUM(co.subtotal_usd), 0) FROM club_orders co WHERE co.member_id = cm.id) as total_spent
      FROM club_members cm
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
        WHERE created_at >= NOW() - CAST(${days + ' days'} AS INTERVAL)
      `,
      // By destination
      sql`
        SELECT destination, COUNT(*) as count
        FROM qr_scans
        WHERE created_at >= NOW() - CAST(${days + ' days'} AS INTERVAL)
        GROUP BY destination ORDER BY count DESC
      `,
      // By source
      sql`
        SELECT source, COUNT(*) as count
        FROM qr_scans
        WHERE created_at >= NOW() - CAST(${days + ' days'} AS INTERVAL)
        GROUP BY source ORDER BY count DESC
      `,
      // By device type
      sql`
        SELECT device_type, COUNT(*) as count
        FROM qr_scans
        WHERE created_at >= NOW() - CAST(${days + ' days'} AS INTERVAL)
        GROUP BY device_type ORDER BY count DESC
      `,
      // By OS
      sql`
        SELECT os, COUNT(*) as count
        FROM qr_scans
        WHERE created_at >= NOW() - CAST(${days + ' days'} AS INTERVAL)
        GROUP BY os ORDER BY count DESC
      `,
      // By browser
      sql`
        SELECT browser, COUNT(*) as count
        FROM qr_scans
        WHERE created_at >= NOW() - CAST(${days + ' days'} AS INTERVAL)
        GROUP BY browser ORDER BY count DESC
      `,
      // Top cities
      sql`
        SELECT city, region, country, COUNT(*) as count
        FROM qr_scans
        WHERE created_at >= NOW() - CAST(${days + ' days'} AS INTERVAL)
          AND city IS NOT NULL AND city != ''
        GROUP BY city, region, country
        ORDER BY count DESC
        LIMIT 10
      `,
      // Scans by day (for chart)
      sql`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM qr_scans
        WHERE created_at >= NOW() - CAST(${days + ' days'} AS INTERVAL)
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
      // Recent scans
      sql`
        SELECT scan_id, source, destination, device_type, os, browser, city, region, country, created_at
        FROM qr_scans
        WHERE created_at >= NOW() - CAST(${days + ' days'} AS INTERVAL)
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
    // date_trunc requires a literal string — can't use parameterized query
    // Use separate queries based on bucket size
    const queryDaily = sql`
      SELECT created_at::date as date, COALESCE(SUM(subtotal_usd), 0) as revenue, COUNT(*)::int as orders
      FROM club_orders
      WHERE (status IS NULL OR status != 'rejected') AND created_at >= NOW() - make_interval(days => ${days})
      GROUP BY created_at::date ORDER BY date ASC
    `
    const queryWeekly = sql`
      SELECT date_trunc('week', created_at)::date as date, COALESCE(SUM(subtotal_usd), 0) as revenue, COUNT(*)::int as orders
      FROM club_orders
      WHERE (status IS NULL OR status != 'rejected') AND created_at >= NOW() - make_interval(days => ${days})
      GROUP BY date_trunc('week', created_at)::date ORDER BY date ASC
    `
    const queryMonthly = sql`
      SELECT date_trunc('month', created_at)::date as date, COALESCE(SUM(subtotal_usd), 0) as revenue, COUNT(*)::int as orders
      FROM club_orders
      WHERE (status IS NULL OR status != 'rejected') AND created_at >= NOW() - make_interval(days => ${days})
      GROUP BY date_trunc('month', created_at)::date ORDER BY date ASC
    `

    const result = await (days <= 30 ? queryDaily : days <= 90 ? queryWeekly : queryMonthly)

    return result.rows.map(r => ({
      date: String(r.date),
      revenue: parseFloat(r.revenue) || 0,
      orders: parseInt(r.orders, 10) || 0,
    }))
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
    status: string
    total_amount: number
    created_at: string
    source: 'orders' | 'club_orders'
    items: OrderItem[]
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
    const searchPattern = query ? `%${query}%` : null

    // Query both tables separately then merge (CTE with parameterized UNION ALL
    // can fail in @vercel/postgres due to duplicate parameter indices)
    const [shopResult, clubResult] = await Promise.all([
      sql`
        SELECT id::text as id, order_number, customer_email, status,
          COALESCE(total_amount, 0)::numeric as total_amount, created_at, items::text as items_raw
        FROM orders
        WHERE (${searchPattern}::text IS NULL OR (order_number ILIKE ${searchPattern} OR customer_email ILIKE ${searchPattern}))
        AND (${status || null}::text IS NULL OR status = ${status})
        AND (${dateFrom || null}::text IS NULL OR created_at >= ${dateFrom}::date)
        AND (${dateTo || null}::text IS NULL OR created_at < (${dateTo}::date + interval '1 day'))
        ORDER BY created_at DESC
      `.catch(() => ({ rows: [] })),
      sql`
        SELECT id::text as id, order_number, member_email as customer_email, status,
          COALESCE(subtotal_usd, 0)::numeric as total_amount, created_at, items::text as items_raw
        FROM club_orders
        WHERE (${searchPattern}::text IS NULL OR (order_number ILIKE ${searchPattern} OR member_email ILIKE ${searchPattern}))
        AND (${status || null}::text IS NULL OR status = ${status})
        AND (${dateFrom || null}::text IS NULL OR created_at >= ${dateFrom}::date)
        AND (${dateTo || null}::text IS NULL OR created_at < (${dateTo}::date + interval '1 day'))
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
        status: row.status,
        total_amount: parseFloat(row.total_amount) || 0,
        created_at: String(row.created_at),
        source: row.source,
        items,
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
    address_line1: string | null
    address_city: string | null
    address_state: string | null
    address_zip: string | null
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
  lifetimeValue: number
  totalOrders: number
}

export async function getCustomerFullProfile(email: string): Promise<CustomerFullProfile> {
  try {
    const normalizedEmail = email.toLowerCase()

    // Run queries in parallel — each wrapped in .catch() so one missing table doesn't crash all
    const emptyResult = { rows: [] }
    const [memberResult, clubOrdersResult, productOrdersResult, membershipResult, intakeResult] = await Promise.all([
      sql`
        SELECT id, name, email, phone, address_line1, address_city, address_state, address_zip, signup_type, source, created_at
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
        SELECT id, order_number, status, total_amount, items, created_at
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
    ])

    const member = memberResult.rows[0] ? {
      id: String(memberResult.rows[0].id),
      name: String(memberResult.rows[0].name),
      email: String(memberResult.rows[0].email),
      phone: memberResult.rows[0].phone ? String(memberResult.rows[0].phone) : null,
      address_line1: memberResult.rows[0].address_line1 ? String(memberResult.rows[0].address_line1) : null,
      address_city: memberResult.rows[0].address_city ? String(memberResult.rows[0].address_city) : null,
      address_state: memberResult.rows[0].address_state ? String(memberResult.rows[0].address_state) : null,
      address_zip: memberResult.rows[0].address_zip ? String(memberResult.rows[0].address_zip) : null,
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

    // Calculate lifetime value from all orders
    const clubTotal = clubOrders.reduce((sum, o) => sum + (o.subtotal_usd || 0), 0)
    const productTotal = productOrders.reduce((sum, o) => sum + o.total_amount, 0)

    return {
      member,
      clubOrders,
      productOrders,
      membership,
      intakeStatus,
      lifetimeValue: clubTotal + productTotal,
      totalOrders: clubOrders.length + productOrders.length,
    }
  } catch (error) {
    console.error('Database error fetching customer full profile:', error)
    throw new DatabaseError('Failed to fetch customer profile', error)
  }
}

// ===========================================
// MEMBER LIFECYCLE MANAGEMENT
// ===========================================

export interface MembershipAdminRow {
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
 * Get all memberships for admin management.
 * Returns all rows from the memberships table, ordered by most recent first.
 */
export async function getAllMembershipsForAdmin(): Promise<MembershipAdminRow[]> {
  try {
    const result = await sql`
      SELECT
        id,
        stripe_customer_id,
        stripe_subscription_id,
        plan_tier,
        subscription_status,
        created_at,
        updated_at,
        cancelled_at,
        cancellation_reason
      FROM memberships
      ORDER BY created_at DESC
    `
    return result.rows as MembershipAdminRow[]
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
