// Healthie Patient Sync
// Idempotent patient creation and linkage for the Healthie EMR integration.
// HIPAA: Never log patient names/emails in production.

import { createClient as healthieCreateClient, getClientByEmail, isHealthieConfigured } from './index'
import type { HealthieUser } from './types'

/**
 * Ensure a Healthie patient record exists for the given email.
 * If one already exists (by email lookup), returns it.
 * If not, creates a new Healthie client.
 * Returns the Healthie user object, or null if Healthie is not configured.
 */
export async function ensureHealthiePatient(
  email: string,
  firstName: string,
  lastName: string,
): Promise<HealthieUser | null> {
  if (!isHealthieConfigured()) {
    return null
  }

  // Check if patient already exists in Healthie
  const existing = await getClientByEmail(email)
  if (existing) {
    return existing
  }

  // Create new patient in Healthie
  const newPatient = await healthieCreateClient({
    first_name: firstName,
    last_name: lastName,
    email,
    skipped_email: true, // Don't send Healthie welcome email — we send our own
  })

  return newPatient
}

/**
 * Link a Healthie patient ID to a CULTR membership record.
 * Updates the ehr_patient_id and ehr_provider columns.
 */
export async function linkHealthiePatient(
  membershipId: string,
  healthiePatientId: string,
): Promise<void> {
  const { sql } = await import('@vercel/postgres')
  await sql`
    UPDATE memberships
    SET ehr_patient_id = ${healthiePatientId},
        ehr_provider = 'healthie',
        updated_at = NOW()
    WHERE id = ${membershipId}
  `
}
