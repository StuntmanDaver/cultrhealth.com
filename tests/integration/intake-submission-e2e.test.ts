import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ============================================================
// MOCKS
// ============================================================

const { mockSql, mockVerifyAuth } = vi.hoisted(() => ({
  mockSql: vi.fn(),
  mockVerifyAuth: vi.fn(),
}))
vi.mock('@vercel/postgres', () => ({
  sql: mockSql,
}))

vi.mock('@/lib/auth', () => ({
  verifyAuth: mockVerifyAuth,
  getSession: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/lib/utils/health', () => ({
  calculateBMI: vi.fn((h: number, w: number) => Math.round((w / (h * h)) * 703 * 10) / 10),
}))

vi.mock('@/lib/utils/phone', () => ({
  formatPhoneNumber: vi.fn((p: string) => '+1' + p.replace(/\D/g, '').slice(-10)),
  isValidPhoneNumber: vi.fn(() => true),
}))

vi.mock('@/lib/portal-db', () => ({
  updatePortalEhrPatientId: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/intake-utils', () => ({
  formatMedicationsList: vi.fn(() => 'Levothyroxine 50mcg'),
  buildPartnerNote: vi.fn(() => 'Test partner note'),
}))

vi.mock('@/lib/contacts', () => ({
  addTagsToContact: vi.fn().mockResolvedValue(undefined),
}))

// ============================================================
// IMPORT ROUTE HANDLER
// ============================================================

import { POST } from '@/app/api/intake/submit/route'

// ============================================================
// TEST DATA
// ============================================================

const VALID_INTAKE = {
  firstName: 'Jane',
  lastName: 'TestPatient',
  email: 'test@example.com',
  phone: '(352) 555-0199',
  dateOfBirth: '1988-06-15',
  gender: 'female',
  shippingAddress: {
    address1: '456 Oak Ave',
    address2: 'Suite 200',
    city: 'Gainesville',
    state: 'FL',
    zipCode: '32601',
  },
  selectedMedications: ['tirzepatide', 'sermorelin'],
  heightFeet: '5',
  heightInches: '6',
  weightLbs: '155',
  goalsMotivation: {
    primaryGoal: 'Lose weight and improve energy',
    whyNow: 'Starting a new fitness program',
    topSymptoms: ['Fatigue', 'Weight gain', 'Poor sleep'],
    priorityProblem: 'Stubborn belly fat',
    urgency: '8',
    previousAttempts: 'Tried intermittent fasting for 3 months',
    discoverySource: 'Instagram recommendation from a friend',
    trustReason: 'Physician-supervised approach',
    barriers: ['Busy work schedule', 'Travel frequently'],
  },
  wellnessQuestionnaire: {
    sleep_quality: 'Fair',
    exercise_frequency: '3-4 times per week',
    diet_type: 'Balanced with occasional fast food',
    energy_level: 'Low to moderate',
    stress_level: 'High',
    alcohol_use: 'Social drinker',
    supplements: 'Vitamin D, Magnesium',
  },
  glp1History: {
    previousGlp1Use: 'No',
    previousGlp1Details: '',
  },
  currentMedications: [
    { name: 'Levothyroxine', dosage: '50mcg', frequency: 'Once daily' },
  ],
  treatmentPreferences: {
    preferredContactMethod: 'Email',
    bestTimeToContact: 'Afternoons',
    pharmacyPreference: 'None',
    customSolution: false,
    additionalNotes: 'Sensitive to injections, prefer smallest gauge needle',
  },
  emailConsent: true,
  marketingConsent: true,
  telehealthConsent: true,
  stripeSessionId: 'cs_test_jane_intake_001',
  planTier: 'catalyst',
}

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/intake/submit', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

// ============================================================
// TESTS
// ============================================================

describe('Intake Submission E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.POSTGRES_URL = 'postgres://test'
    mockVerifyAuth.mockResolvedValue({
      authenticated: true,
      email: 'test@example.com',
      customerId: 'cus_test',
      role: 'member',
    })

    // Default: SQL operations succeed
    mockSql.mockResolvedValue({ rows: [], rowCount: 1 })
  })

  function getQueryText(queryParts: unknown): string {
    return Array.isArray(queryParts) ? queryParts.join(' ') : String(queryParts)
  }

  function getJsonPayloadFromUpdateCall(): Record<string, unknown> {
    const updateCall = mockSql.mock.calls.find(([queryParts]) =>
      getQueryText(queryParts).includes('UPDATE pending_intakes')
    )

    expect(updateCall).toBeDefined()

    const jsonArg = updateCall?.find((arg) =>
      typeof arg === 'string' && arg.trim().startsWith('{')
    )

    expect(jsonArg).toBeDefined()

    return JSON.parse(jsonArg as string) as Record<string, unknown>
  }

  // ----------------------------------------------------------
  // VALIDATION
  // ----------------------------------------------------------

  describe('Validation', () => {
    it('rejects submission with missing required fields', async () => {
      const res = await POST(makeRequest({ firstName: 'Jane' }))
      const json = await res.json()

      expect(res.status).toBe(400)
      expect(json.success).toBe(false)
      expect(json.error).toContain('Missing required fields')
      expect(json.error).toContain('lastName')
      expect(json.error).toContain('email')
      expect(json.error).toContain('phone')
    })

    it('rejects submission with no medications selected', async () => {
      const body = { ...VALID_INTAKE, selectedMedications: [] }
      const res = await POST(makeRequest(body))
      const json = await res.json()

      expect(res.status).toBe(400)
      expect(json.error).toContain('At least one medication must be selected')
    })

    it('accepts legacy single selectedMedication field', async () => {
      const body = { ...VALID_INTAKE, selectedMedications: undefined, selectedMedication: 'tirzepatide' }
      const res = await POST(makeRequest(body))
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
    })

    it('rejects submission when payload email does not match authenticated session', async () => {
      mockVerifyAuth.mockResolvedValue({
        authenticated: true,
        email: 'member@example.com',
        customerId: 'cus_test',
        role: 'member',
      })

      const res = await POST(makeRequest({ ...VALID_INTAKE, email: 'other@example.com' }))
      const json = await res.json()

      expect(res.status).toBe(403)
      expect(json.success).toBe(false)
      expect(json.error).toContain('authenticated')
    })
  })

  // ----------------------------------------------------------
  // LOCAL DB PERSISTENCE
  // ----------------------------------------------------------

  describe('Local DB persistence', () => {
    it('saves intake to local database and returns success', async () => {
      const res = await POST(makeRequest(VALID_INTAKE))
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.patientId).toBeDefined()
      expect(typeof json.patientId).toBe('number')
      // SQL should have been called for UPDATE pending_intakes, INSERT asher_orders, and onboarding sync
      expect(mockSql).toHaveBeenCalled()
    })

    it('returns success even when DB operations fail', async () => {
      mockSql.mockRejectedValue(new Error('DB connection failed'))

      const res = await POST(makeRequest(VALID_INTAKE))
      const json = await res.json()

      // Route should still return success (DB save is non-fatal in error handler)
      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
    })

    it('includes patientId in response', async () => {
      const res = await POST(makeRequest(VALID_INTAKE))
      const json = await res.json()

      expect(json.patientId).toBeDefined()
      expect(json.message).toBe('Intake form submitted successfully')
    })

    it('stores compatibility fields consumed by downstream member and portal APIs', async () => {
      const res = await POST(makeRequest(VALID_INTAKE))
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)

      const persistedPayload = getJsonPayloadFromUpdateCall()

      expect(persistedPayload.email).toBe(VALID_INTAKE.email)
      expect(persistedPayload.dateOfBirth).toBe(VALID_INTAKE.dateOfBirth)
      expect(persistedPayload.gender).toBe(VALID_INTAKE.gender)
      expect(persistedPayload.shippingAddress).toEqual(VALID_INTAKE.shippingAddress)
      expect(persistedPayload.personalInformation).toMatchObject({
        firstName: VALID_INTAKE.firstName,
        lastName: VALID_INTAKE.lastName,
        email: VALID_INTAKE.email,
        phone: VALID_INTAKE.phone,
        dateOfBirth: VALID_INTAKE.dateOfBirth,
        gender: VALID_INTAKE.gender,
      })
      expect(persistedPayload.medicationPackages).toEqual([
        {
          productId: 'tirzepatide',
          name: 'tirzepatide',
          duration: 30,
          medicationType: 'Injection',
        },
        {
          productId: 'sermorelin',
          name: 'sermorelin',
          duration: 30,
          medicationType: 'Injection',
        },
      ])
    })

    it('updates onboarding progress when intake submission succeeds', async () => {
      const res = await POST(makeRequest(VALID_INTAKE))
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)

      const onboardingCall = mockSql.mock.calls.find(([queryParts]) =>
        getQueryText(queryParts).includes('member_onboarding')
      )

      expect(onboardingCall).toBeDefined()
    })

    it('updates the latest pending intake for the authenticated member even when session id is missing', async () => {
      mockSql.mockImplementation((queryParts: unknown) => {
        if (getQueryText(queryParts).includes('SELECT id, stripe_payment_intent_id')) {
          return Promise.resolve({
            rows: [{ id: 77, stripe_payment_intent_id: 'cs_fallback_pending', session_id: 'cs_fallback_pending' }],
            rowCount: 1,
          })
        }

        return Promise.resolve({ rows: [], rowCount: 1 })
      })

      const res = await POST(makeRequest({ ...VALID_INTAKE, stripeSessionId: '' }))
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)

      const pendingUpdateCall = mockSql.mock.calls.find(([queryParts]) =>
        getQueryText(queryParts).includes('UPDATE pending_intakes')
      )

      expect(pendingUpdateCall).toBeDefined()
    })
  })

  // ----------------------------------------------------------
  // MAILCHIMP TAGGING
  // ----------------------------------------------------------

  describe('Mailchimp tagging', () => {
    it('tags contact as intake-complete', async () => {
      const { addTagsToContact } = await import('@/lib/contacts')

      await POST(makeRequest(VALID_INTAKE))

      expect(addTagsToContact).toHaveBeenCalledWith(
        'test@example.com',
        ['intake-complete']
      )
    })
  })
})
