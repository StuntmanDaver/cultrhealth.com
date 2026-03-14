// Portal Prefill Data Layer
// Maps Asher Med patient/order data into intake and renewal form shapes.

import type { AsherPatient } from '@/lib/asher-med-api'
import type { SimpleFormData } from '@/lib/contexts/intake-form-context'

// ============================================================
// TYPES
// ============================================================

export interface RenewalPrefill {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: 'male' | 'female'
  shippingAddress?: {
    address1: string
    address2?: string
    city: string
    state: string
    zipCode: string
  }
  lastMedication: string | null
}

export interface SupplyEstimate {
  daysRemaining: number
  isLow: boolean
}

// ============================================================
// MAPPING FUNCTIONS
// ============================================================

/**
 * Convert an AsherPatient into Partial<SimpleFormData> for intake form pre-fill.
 * Maps field names and converts units (height inches -> feet+inches, gender uppercase -> lowercase).
 */
export function mapPatientToIntakeData(patient: AsherPatient): Partial<SimpleFormData> {
  const result: Partial<SimpleFormData> = {
    firstName: patient.firstName,
    lastName: patient.lastName,
    email: patient.email,
    phone: patient.phoneNumber,
    dateOfBirth: patient.dateOfBirth,
    gender: patient.gender.toLowerCase() as 'male' | 'female',
  }

  // Height conversion: total inches -> feet + remaining inches
  if (patient.height != null) {
    result.heightFeet = Math.floor(patient.height / 12)
    result.heightInches = patient.height % 12
  }

  // Weight
  if (patient.weight != null) {
    result.weightLbs = patient.weight
  }

  // Shipping address (map field names: stateAbbreviation -> state, zipcode -> zipCode)
  if (patient.address1 && patient.city && patient.stateAbbreviation && patient.zipcode) {
    result.shippingAddress = {
      address1: patient.address1,
      address2: patient.address2 || undefined,
      city: patient.city,
      state: patient.stateAbbreviation,
      zipCode: patient.zipcode,
    }
  }

  return result
}

/**
 * Convert an AsherPatient + last medication name into renewal form pre-fill data.
 * Provides all identity/address fields the renewal form needs, skipping the phone verify step.
 */
export function mapPatientToRenewalData(patient: AsherPatient, lastMedication: string | null): RenewalPrefill {
  const result: RenewalPrefill = {
    firstName: patient.firstName,
    lastName: patient.lastName,
    email: patient.email,
    phone: patient.phoneNumber,
    dateOfBirth: patient.dateOfBirth,
    gender: patient.gender.toLowerCase() as 'male' | 'female',
    lastMedication,
  }

  // Shipping address
  if (patient.address1 && patient.city && patient.stateAbbreviation && patient.zipcode) {
    result.shippingAddress = {
      address1: patient.address1,
      address2: patient.address2 || undefined,
      city: patient.city,
      state: patient.stateAbbreviation,
      zipCode: patient.zipcode,
    }
  }

  return result
}

/**
 * Estimate remaining supply days from order creation date and medication duration.
 * isLow threshold: <= 7 days remaining.
 * daysRemaining is clamped to minimum 0.
 */
export function estimateSupplyDays(orderCreatedAt: string, durationDays: number): SupplyEstimate {
  const orderDate = new Date(orderCreatedAt)
  const now = new Date()
  const elapsedMs = now.getTime() - orderDate.getTime()
  const elapsedDays = Math.floor(elapsedMs / (24 * 60 * 60 * 1000))
  const daysRemaining = Math.max(0, durationDays - elapsedDays)

  return {
    daysRemaining,
    isLow: daysRemaining <= 7,
  }
}
