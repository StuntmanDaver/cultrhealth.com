import { sql } from '@vercel/postgres'

// ===========================================
// TYPES
// ===========================================

export interface PortalSessionRow {
  id: string
  phone: string
  phone_e164: string
  asher_patient_id: number | null
  first_name: string | null
  last_name: string | null
  verified_at: Date
  last_login_at: Date
  created_at: Date
  updated_at: Date
}

// ===========================================
// DATABASE ERROR HANDLING
// ===========================================

export class PortalDatabaseError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message)
    this.name = 'PortalDatabaseError'
  }
}

// ===========================================
// DATABASE OPERATIONS
// ===========================================

/**
 * Insert or update a portal session record.
 * Uses INSERT ... ON CONFLICT(phone_e164) DO UPDATE to upsert.
 * Updates last_login_at, asher_patient_id (if provided), first_name, last_name, updated_at.
 */
export async function upsertPortalSession(
  phone: string,
  phoneE164: string,
  asherPatientId: number | null,
  firstName?: string,
  lastName?: string
): Promise<void> {
  try {
    await sql`
      INSERT INTO portal_sessions (phone, phone_e164, asher_patient_id, first_name, last_name)
      VALUES (${phone}, ${phoneE164}, ${asherPatientId}, ${firstName || null}, ${lastName || null})
      ON CONFLICT (phone_e164) DO UPDATE SET
        phone = EXCLUDED.phone,
        asher_patient_id = COALESCE(EXCLUDED.asher_patient_id, portal_sessions.asher_patient_id),
        first_name = COALESCE(EXCLUDED.first_name, portal_sessions.first_name),
        last_name = COALESCE(EXCLUDED.last_name, portal_sessions.last_name),
        last_login_at = NOW(),
        updated_at = NOW()
    `
  } catch (error) {
    throw new PortalDatabaseError('Failed to upsert portal session', error)
  }
}

/**
 * Look up a portal session by E.164 phone number.
 * Returns the matching row or null if not found.
 */
export async function getPortalSessionByPhone(
  phoneE164: string
): Promise<PortalSessionRow | null> {
  try {
    const result = await sql`
      SELECT id, phone, phone_e164, asher_patient_id, first_name, last_name,
             verified_at, last_login_at, created_at, updated_at
      FROM portal_sessions
      WHERE phone_e164 = ${phoneE164}
    `
    if (result.rows.length === 0) return null
    return result.rows[0] as PortalSessionRow
  } catch (error) {
    throw new PortalDatabaseError('Failed to get portal session by phone', error)
  }
}

/**
 * Update the Asher Med patient ID for an existing portal session.
 * Called when a patient is found/created in Asher Med after initial OTP verification.
 */
export async function updatePortalPatientId(
  phoneE164: string,
  asherPatientId: number
): Promise<void> {
  try {
    await sql`
      UPDATE portal_sessions
      SET asher_patient_id = ${asherPatientId},
          updated_at = NOW()
      WHERE phone_e164 = ${phoneE164}
    `
  } catch (error) {
    throw new PortalDatabaseError('Failed to update portal patient ID', error)
  }
}
