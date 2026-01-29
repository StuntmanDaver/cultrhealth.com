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
  healthie_patient_id?: string
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
  healthie_patient_id?: string
}

export interface UpdateMembershipInput {
  subscription_status?: string
  plan_tier?: string
  healthie_patient_id?: string
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
  const { stripe_customer_id, stripe_subscription_id, plan_tier, subscription_status, healthie_patient_id } = input
  
  try {
    const result = await sql`
      INSERT INTO memberships (
        stripe_customer_id, 
        stripe_subscription_id, 
        plan_tier, 
        subscription_status, 
        healthie_patient_id,
        created_at, 
        updated_at
      )
      VALUES (
        ${stripe_customer_id}, 
        ${stripe_subscription_id}, 
        ${plan_tier}, 
        ${subscription_status}, 
        ${healthie_patient_id || null},
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
    if (input.healthie_patient_id !== undefined) {
      updates.push('healthie_patient_id')
      values.push(input.healthie_patient_id)
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
        healthie_patient_id = COALESCE(${input.healthie_patient_id || null}, healthie_patient_id),
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
// ORDER / SALES TRACKING
// ===========================================

export interface OrderEntry {
  id: string
  order_number: string
  customer_email: string
  stripe_payment_intent_id?: string
  stripe_customer_id?: string
  healthie_patient_id?: string
  payment_provider: 'stripe' | 'klarna' | 'affirm' | 'authorize_net' | 'healthie'
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
  healthie_patient_id?: string
  payment_provider?: 'stripe' | 'klarna' | 'affirm' | 'authorize_net' | 'healthie'
  status: 'pending' | 'paid' | 'shipped' | 'fulfilled' | 'cancelled' | 'refunded'
  total_amount: number
  currency?: string
  items: OrderItem[]
  notes?: string
}

export interface UpdateOrderInput {
  status?: 'pending' | 'paid' | 'fulfilled' | 'cancelled' | 'refunded' | 'shipped'
  healthie_patient_id?: string
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
    healthie_patient_id,
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
        healthie_patient_id,
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
        ${healthie_patient_id || null},
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
        healthie_patient_id = COALESCE(${input.healthie_patient_id || null}, healthie_patient_id),
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
    // Get total orders and revenue
    const totalsResult = await sql`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '${days} days'
        AND status IN ('paid', 'fulfilled')
    `

    // Get orders by status
    const statusResult = await sql`
      SELECT status, COUNT(*) as count
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY status
    `

    // Get recent orders
    const recentResult = await sql`
      SELECT * FROM orders 
      ORDER BY created_at DESC
      LIMIT 20
    `

    const ordersByStatus: Record<string, number> = {}
    statusResult.rows.forEach(row => {
      ordersByStatus[row.status] = parseInt(row.count, 10)
    })

    // Calculate top products from recent orders
    const productMap = new Map<string, { sku: string; name: string; quantity: number; revenue: number }>()
    
    const recentOrders = recentResult.rows.map(row => {
      const items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items
      
      // Aggregate product stats
      if (row.status === 'paid' || row.status === 'fulfilled') {
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
  healthie_patient_id?: string
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
  healthie_patient_id?: string
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
        user_id, healthie_patient_id, log_date,
        energy_level, mood_rating, sleep_quality, sleep_hours, stress_level,
        weight_kg, resting_hr, hrv_ms, blood_pressure_systolic, blood_pressure_diastolic,
        wearable_source, wearable_sleep_score, wearable_readiness_score, wearable_activity_score,
        deep_sleep_minutes, rem_sleep_minutes, steps,
        protocol_id, protocol_adherence_pct, supplements_taken, peptides_administered,
        notes, symptoms_reported, created_at, updated_at
      )
      VALUES (
        ${input.user_id}, ${input.healthie_patient_id || null}, ${input.log_date},
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
  healthie_patient_id?: string
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
  healthie_patient_id?: string
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
        user_id, healthie_patient_id, biomarker_id, biomarker_name, category,
        value, unit, original_value, original_unit, original_name,
        confidence, conversion_applied, source, lab_company, reference_range,
        measured_at, score, status, created_at, updated_at
      )
      VALUES (
        ${input.user_id}, ${input.healthie_patient_id || null},
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
  healthie_patient_id?: string
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
  healthie_patient_id?: string
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
        user_id, healthie_patient_id, protocol_id, protocol_version, protocol_type,
        template_id, symptom_ids, started_at, expected_outcomes,
        baseline_resilience_score, baseline_phenotype, status,
        goals_total, created_at, updated_at
      )
      VALUES (
        ${input.user_id}, ${input.healthie_patient_id || null},
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
  healthie_patient_id?: string
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
  healthie_patient_id?: string
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
        user_id, healthie_patient_id, overall_score, grade, category_scores,
        data_completeness, biomarkers_used, chronological_age, biological_age, age_gap,
        primary_phenotype, secondary_phenotypes, phenotype_confidence,
        top_strengths, priority_areas, protocol_outcome_id,
        calculated_at, created_at
      )
      VALUES (
        ${input.user_id}, ${input.healthie_patient_id || null},
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
