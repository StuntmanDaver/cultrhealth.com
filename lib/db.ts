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
