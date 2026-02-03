// Healthie SSO (Single Sign-On) Integration
// Generates secure SSO tokens for automatic authentication into Healthie patient portal
// Reference: https://docs.gethealthie.com/docs/single-sign-on-sso

import { SignJWT } from 'jose'
import { getHealthiePatientPortalUrl } from './config/healthie'

// ============================================================
// HEALTHIE SSO TOKEN GENERATION
// ============================================================

const HEALTHIE_SSO_SECRET = new TextEncoder().encode(
  process.env.HEALTHIE_SSO_SECRET || process.env.HEALTHIE_API_KEY || ''
)

export interface HealthieSSOTokenPayload {
  email: string
  healthiePatientId?: string
  redirectPath?: string
}

/**
 * Generate a Healthie SSO token for automatic patient portal authentication
 * 
 * @param email - Patient's email address (required by Healthie)
 * @param healthiePatientId - Optional Healthie patient ID for direct lookup
 * @param redirectPath - Optional path to redirect to after authentication (e.g., '/messages', '/book')
 * @returns SSO token string
 */
export async function generateHealthieSSOToken(
  payload: HealthieSSOTokenPayload
): Promise<string> {
  if (!process.env.HEALTHIE_API_KEY) {
    throw new Error('HEALTHIE_API_KEY not configured')
  }

  // Healthie expects JWT with specific claims
  const jwt = new SignJWT({
    email: payload.email,
    // Include patient ID if available for faster lookup
    ...(payload.healthiePatientId && { patient_id: payload.healthiePatientId }),
    // Include redirect path if specified
    ...(payload.redirectPath && { redirect_to: payload.redirectPath }),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m') // Short-lived for security (5 minutes)
    .setIssuer('cultr-health')
    .setAudience('gethealthie')

  return jwt.sign(HEALTHIE_SSO_SECRET)
}

/**
 * Generate a complete Healthie SSO URL with embedded authentication token
 * 
 * @param email - Patient's email address
 * @param healthiePatientId - Optional Healthie patient ID
 * @param redirectPath - Optional path within Healthie to redirect to
 * @returns Complete SSO URL ready to open
 */
export async function generateHealthieSSOUrl(
  email: string,
  healthiePatientId?: string,
  redirectPath?: string
): Promise<string> {
  const token = await generateHealthieSSOToken({
    email,
    healthiePatientId,
    redirectPath,
  })

  const baseUrl = getHealthiePatientPortalUrl()
  
  // Healthie SSO URL format: https://secureclient.gethealthie.com/sso?token=JWT_TOKEN
  const ssoUrl = new URL(`${baseUrl}/sso`)
  ssoUrl.searchParams.set('token', token)
  
  // If redirect path is specified, add it to URL
  if (redirectPath) {
    ssoUrl.searchParams.set('redirect_to', redirectPath)
  }

  return ssoUrl.toString()
}

/**
 * Generate SSO URL for specific Healthie features
 * 
 * VERIFIED HEALTHIE PORTAL PATHS (from official documentation):
 * - /appointments - View/manage appointments
 * - /book - Book new appointment
 * - /chat - Secure messaging (NOT /messages)
 * - /forms - Intake forms and questionnaires
 * - /documents - Documents, lab results, files
 * - /billing - Invoices, payment methods, packages
 * - /programs - Programs and courses
 * - /settings - Account settings and profile
 */
export const HealthieSSOUrls = {
  /**
   * General portal access (dashboard)
   */
  portal: (email: string, healthiePatientId?: string) =>
    generateHealthieSSOUrl(email, healthiePatientId),

  /**
   * Book new appointment
   * Path: /book
   */
  bookAppointment: (email: string, healthiePatientId?: string) =>
    generateHealthieSSOUrl(email, healthiePatientId, '/book'),

  /**
   * View/manage appointments
   * Path: /appointments
   */
  appointments: (email: string, healthiePatientId?: string) =>
    generateHealthieSSOUrl(email, healthiePatientId, '/appointments'),

  /**
   * Secure messaging
   * Path: /chat (NOT /messages - verified from Healthie docs)
   */
  messages: (email: string, healthiePatientId?: string) =>
    generateHealthieSSOUrl(email, healthiePatientId, '/chat'),

  /**
   * Lab results - stored in Documents section
   * Path: /documents (labs are uploaded as documents in Healthie)
   */
  labs: (email: string, healthiePatientId?: string) =>
    generateHealthieSSOUrl(email, healthiePatientId, '/documents'),

  /**
   * Forms and intake questionnaires
   * Path: /forms
   */
  forms: (email: string, healthiePatientId?: string) =>
    generateHealthieSSOUrl(email, healthiePatientId, '/forms'),

  /**
   * Documents and files
   * Path: /documents
   */
  documents: (email: string, healthiePatientId?: string) =>
    generateHealthieSSOUrl(email, healthiePatientId, '/documents'),

  /**
   * Billing, invoices, and payment methods
   * Path: /billing
   */
  billing: (email: string, healthiePatientId?: string) =>
    generateHealthieSSOUrl(email, healthiePatientId, '/billing'),

  /**
   * Account settings and profile
   * Path: /settings (profile is part of settings in Healthie)
   */
  profile: (email: string, healthiePatientId?: string) =>
    generateHealthieSSOUrl(email, healthiePatientId, '/settings'),

  /**
   * Health metrics - tracked via journal entries in Healthie
   * Path: /documents (metrics/entries accessible from documents/dashboard)
   */
  metrics: (email: string, healthiePatientId?: string) =>
    generateHealthieSSOUrl(email, healthiePatientId, '/documents'),

  /**
   * Care plans - accessible from documents section
   * Path: /documents (care plans stored as documents)
   */
  carePlans: (email: string, healthiePatientId?: string) =>
    generateHealthieSSOUrl(email, healthiePatientId, '/documents'),

  /**
   * Programs and courses
   * Path: /programs
   */
  programs: (email: string, healthiePatientId?: string) =>
    generateHealthieSSOUrl(email, healthiePatientId, '/programs'),
}

// ============================================================
// HEALTHIE PATIENT CREATION WITH SSO
// ============================================================

/**
 * Create a patient in Healthie and return their ID for SSO
 * Call this when a new member subscribes to ensure they have a Healthie account
 */
export async function createHealthiePatientForMember(input: {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
}): Promise<string> {
  const { createPatient } = await import('./healthie-api')
  
  try {
    const patient = await createPatient({
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      phoneNumber: input.phone,
    })
    
    return patient.id
  } catch (error) {
    console.error('Failed to create Healthie patient:', error)
    throw error
  }
}

/**
 * Get or create Healthie patient for a member
 * Checks if patient exists by email, creates if not found
 */
export async function ensureHealthiePatient(input: {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
}): Promise<string> {
  const { getPatientByEmail, createPatient } = await import('./healthie-api')
  
  try {
    // Check if patient already exists
    const existingPatient = await getPatientByEmail(input.email)
    
    if (existingPatient) {
      return existingPatient.id
    }
    
    // Create new patient
    const newPatient = await createPatient({
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      phoneNumber: input.phone,
    })
    
    return newPatient.id
  } catch (error) {
    console.error('Failed to ensure Healthie patient:', error)
    throw error
  }
}
