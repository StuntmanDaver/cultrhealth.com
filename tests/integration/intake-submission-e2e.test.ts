import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ============================================================
// MOCKS — use vi.hoisted() so variables are available inside vi.mock factories
// ============================================================

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }))
vi.mock('@vercel/postgres', () => ({
  sql: mockSql,
}))

vi.mock('@/lib/auth', () => ({
  verifyAuth: vi.fn().mockResolvedValue({ authenticated: true, email: 'test@example.com', customerId: 'cus_test', role: 'member' }),
  getSession: vi.fn().mockResolvedValue(null),
}))

const mockCreateNewOrder = vi.fn()
const mockUpdateOrderApproval = vi.fn()
const mockGetOrders = vi.fn()
const mockFormatPhoneNumber = vi.fn((p: string) => '+1' + p.replace(/\D/g, '').slice(-10))
const mockCalculateBMI = vi.fn((h: number, w: number) => Math.round((w / (h * h)) * 703 * 10) / 10)

vi.mock('@/lib/asher-med-api', () => ({
  createNewOrder: (...args: unknown[]) => mockCreateNewOrder(...args),
  updateOrderApproval: (...args: unknown[]) => mockUpdateOrderApproval(...args),
  getOrders: (...args: unknown[]) => mockGetOrders(...args),
  formatPhoneNumber: (p: string) => mockFormatPhoneNumber(p),
  calculateBMI: (h: number, w: number) => mockCalculateBMI(h, w),
}))

vi.mock('@/lib/portal-db', () => ({
  updatePortalPatientId: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/config/asher-med', () => ({
  MEDICATION_OPTIONS: [
    { id: 'semaglutide', name: 'Semaglutide', isGLP1: true, durations: [28, 56, 84], types: ['Injection'] },
    { id: 'tirzepatide', name: 'Tirzepatide', isGLP1: true, durations: [28, 56, 84], types: ['Injection'] },
    { id: 'r3ta', name: 'Other', isGLP1: true, durations: [28, 56, 84], types: ['Injection'] },
    { id: 'ghk-cu', name: 'GHK-Cu', isGLP1: false, durations: [30, 60, 90], types: ['Injection'] },
    { id: 'bpc157-tb500', name: 'BPC-157/TB-500', isGLP1: false, durations: [30, 60, 90], types: ['Injection'] },
    { id: 'nad-plus', name: 'NAD+', isGLP1: false, durations: [30, 60, 90], types: ['Injection'] },
    { id: 'tesa-ipa', name: 'Tesofensine/Ipamorelin', isGLP1: false, durations: [30, 60, 90], types: ['Injection'] },
    { id: 'cjc1295-ipa', name: 'CJC-1295/Ipamorelin', isGLP1: false, durations: [30, 60, 90], types: ['Injection'] },
    { id: 'semax-selank', name: 'Semax/Selank', isGLP1: false, durations: [30, 60, 90], types: ['Injection'] },
    { id: 'melanotan2', name: 'Other', isGLP1: false, durations: [30], types: ['Injection'] },
  ],
}))

vi.mock('@/lib/config/product-to-asher-mapping', () => ({
  getAsherMedIdFromProductId: (id: string) => id,
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
  email: 'jane.testpatient@example.com',
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
  selectedMedications: ['tirzepatide', 'ghk-cu'],
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
  idDocumentKey: 'uploads/2026-03-24/id_jane_test.jpg',
  telehealthSignatureKey: 'uploads/2026-03-24/sig_jane_test.png',
  compoundedConsentKey: 'uploads/2026-03-24/consent_jane_test.png',
  stripeSessionId: 'cs_test_jane_intake_001',
  planTier: 'catalyst',
}

const MOCK_PATIENT_ID = 99001
const MOCK_ORDER_ID = 55001

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
    process.env.ASHER_MED_API_KEY = 'test-key'
    process.env.POSTGRES_URL = 'postgres://test'

    // Default: Asher Med createNewOrder succeeds
    mockCreateNewOrder.mockResolvedValue({
      success: true,
      data: { id: MOCK_PATIENT_ID },
    })

    // Default: getOrders returns the new order
    mockGetOrders.mockResolvedValue({
      success: true,
      data: [{ id: MOCK_ORDER_ID, status: 'PENDING' }],
    })

    // Default: updateOrderApproval succeeds
    mockUpdateOrderApproval.mockResolvedValue({ success: true })

    // Default: SQL operations succeed
    mockSql.mockResolvedValue({ rows: [], rowCount: 1 })
  })

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

    it('rejects submission with invalid medication IDs', async () => {
      const body = { ...VALID_INTAKE, selectedMedications: ['fake-med-xyz'] }
      const res = await POST(makeRequest(body))
      const json = await res.json()

      expect(res.status).toBe(400)
      expect(json.error).toContain('Invalid medication selection')
    })

    it('accepts legacy single selectedMedication field', async () => {
      const body = { ...VALID_INTAKE, selectedMedications: undefined, selectedMedication: 'tirzepatide' }
      const res = await POST(makeRequest(body))
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
    })
  })

  // ----------------------------------------------------------
  // ASHER MED ORDER CONSTRUCTION
  // ----------------------------------------------------------

  describe('Asher Med order construction', () => {
    it('builds correct order request from intake data', async () => {
      await POST(makeRequest(VALID_INTAKE))

      expect(mockCreateNewOrder).toHaveBeenCalledTimes(1)
      const orderReq = mockCreateNewOrder.mock.calls[0][0]

      // Personal info
      expect(orderReq.personalInformation.firstName).toBe('Jane')
      expect(orderReq.personalInformation.lastName).toBe('TestPatient')
      expect(orderReq.personalInformation.email).toBe('jane.testpatient@example.com')
      expect(orderReq.personalInformation.dateOfBirth).toBe('1988-06-15')
      expect(orderReq.personalInformation.gender).toBe('FEMALE')
    })

    it('formats phone number to E.164', async () => {
      await POST(makeRequest(VALID_INTAKE))
      expect(mockFormatPhoneNumber).toHaveBeenCalledWith('(352) 555-0199')

      const orderReq = mockCreateNewOrder.mock.calls[0][0]
      expect(orderReq.personalInformation.phoneNumber).toMatch(/^\+1\d{10}$/)
    })

    it('maps shipping address correctly', async () => {
      await POST(makeRequest(VALID_INTAKE))
      const orderReq = mockCreateNewOrder.mock.calls[0][0]

      expect(orderReq.shippingAddress.address1).toBe('456 Oak Ave')
      expect(orderReq.shippingAddress.apartmentNumber).toBe('Suite 200')
      expect(orderReq.shippingAddress.city).toBe('Gainesville')
      expect(orderReq.shippingAddress.stateAbbreviation).toBe('FL')
      expect(orderReq.shippingAddress.zipCode).toBe('32601')
      expect(orderReq.shippingAddress.country).toBe('US')
    })

    it('calculates BMI from height and weight', async () => {
      await POST(makeRequest(VALID_INTAKE))
      const orderReq = mockCreateNewOrder.mock.calls[0][0]

      // 5'6" = 66 inches, 155 lbs
      expect(orderReq.physicalMeasurements.height).toBe(66)
      expect(orderReq.physicalMeasurements.weight).toBe(155)
      expect(mockCalculateBMI).toHaveBeenCalledWith(66, 155)
      expect(typeof orderReq.physicalMeasurements.bmi).toBe('number')
    })

    it('maps medications to Asher Med format with correct types', async () => {
      await POST(makeRequest(VALID_INTAKE))
      const orderReq = mockCreateNewOrder.mock.calls[0][0]

      expect(orderReq.medicationPackages).toHaveLength(2)
      expect(orderReq.medicationPackages[0]).toEqual({
        name: 'Tirzepatide',
        duration: 28,
        medicationType: 'Injection',
      })
      expect(orderReq.medicationPackages[1]).toEqual({
        name: 'GHK-Cu',
        duration: 30,
        medicationType: 'Injection',
      })
    })

    it('sets medicationTypeSelection to GLP1 when GLP-1 med is selected', async () => {
      await POST(makeRequest(VALID_INTAKE))
      const orderReq = mockCreateNewOrder.mock.calls[0][0]
      expect(orderReq.medicationTypeSelection).toBe('GLP1')
    })

    it('sets medicationTypeSelection to NonGLP1 when no GLP-1 meds', async () => {
      const body = { ...VALID_INTAKE, selectedMedications: ['ghk-cu', 'nad-plus'] }
      await POST(makeRequest(body))
      const orderReq = mockCreateNewOrder.mock.calls[0][0]
      expect(orderReq.medicationTypeSelection).toBe('NonGLP1')
    })

    it('includes GLP-1 history only when GLP-1 medication selected', async () => {
      // With GLP-1
      await POST(makeRequest(VALID_INTAKE))
      let orderReq = mockCreateNewOrder.mock.calls[0][0]
      expect(orderReq.glp1MedicationHistory).toBeDefined()

      // Without GLP-1
      vi.clearAllMocks()
      mockCreateNewOrder.mockResolvedValue({ success: true, data: { id: MOCK_PATIENT_ID } })
      mockGetOrders.mockResolvedValue({ success: true, data: [{ id: MOCK_ORDER_ID }] })
      mockUpdateOrderApproval.mockResolvedValue({ success: true })
      mockSql.mockResolvedValue({ rows: [], rowCount: 1 })

      const body = { ...VALID_INTAKE, selectedMedications: ['ghk-cu'] }
      await POST(makeRequest(body))
      orderReq = mockCreateNewOrder.mock.calls[0][0]
      expect(orderReq.glp1MedicationHistory).toBeUndefined()
    })

    it('includes S3 keys for ID, telehealth consent, and compounded consent', async () => {
      await POST(makeRequest(VALID_INTAKE))
      const orderReq = mockCreateNewOrder.mock.calls[0][0]

      expect(orderReq.idDocumentUpload.frontIDFileS3Key).toBe('uploads/2026-03-24/id_jane_test.jpg')
      expect(orderReq.idDocumentUpload.isGovernmentIDConfirmed).toBe(true)
      expect(orderReq.telehealthConsent.telehealthSigS3Key).toBe('uploads/2026-03-24/sig_jane_test.png')
      expect(orderReq.telehealthConsent.agreeTelehealthService).toBe(true)
      expect(orderReq.consentAcknowledgments.consentCompoundedSigS3Key).toBe('uploads/2026-03-24/consent_jane_test.png')
      expect(orderReq.consentAcknowledgments.consentHealthcareConsultation).toBe(true)
    })

    it('merges goals & motivation into wellness questionnaire', async () => {
      await POST(makeRequest(VALID_INTAKE))
      const orderReq = mockCreateNewOrder.mock.calls[0][0]

      // Original wellness fields
      expect(orderReq.wellnessQuestionnaire.sleep_quality).toBe('Fair')
      expect(orderReq.wellnessQuestionnaire.stress_level).toBe('High')

      // Merged goals fields (prefixed with goals_)
      expect(orderReq.wellnessQuestionnaire.goals_primary_result).toBe('Lose weight and improve energy')
      expect(orderReq.wellnessQuestionnaire.goals_why_seeking_help_now).toBe('Starting a new fitness program')
      expect(orderReq.wellnessQuestionnaire.goals_top_symptoms).toBe('Fatigue, Weight gain, Poor sleep')
      expect(orderReq.wellnessQuestionnaire.goals_urgency_1_to_10).toBe('8')
      expect(orderReq.wellnessQuestionnaire.goals_barriers_to_follow_through).toBe('Busy work schedule, Travel frequently')
    })

    it('formats current medications for Asher Med', async () => {
      await POST(makeRequest(VALID_INTAKE))
      const orderReq = mockCreateNewOrder.mock.calls[0][0]

      expect(orderReq.currentMedicationDetails).toBeDefined()
      expect(orderReq.currentMedicationDetails.which_medications_have_you_been_taking).toContain('Levothyroxine')
    })

    it('sets treatment preferences correctly', async () => {
      await POST(makeRequest(VALID_INTAKE))
      const orderReq = mockCreateNewOrder.mock.calls[0][0]
      expect(orderReq.treatmentPreferences.providerCustomSolution).toBe('no_custom')

      // With custom solution
      vi.clearAllMocks()
      mockCreateNewOrder.mockResolvedValue({ success: true, data: { id: MOCK_PATIENT_ID } })
      mockGetOrders.mockResolvedValue({ success: true, data: [{ id: MOCK_ORDER_ID }] })
      mockUpdateOrderApproval.mockResolvedValue({ success: true })
      mockSql.mockResolvedValue({ rows: [], rowCount: 1 })

      const body = {
        ...VALID_INTAKE,
        treatmentPreferences: { ...VALID_INTAKE.treatmentPreferences, customSolution: true },
      }
      await POST(makeRequest(body))
      const req2 = mockCreateNewOrder.mock.calls[0][0]
      expect(req2.treatmentPreferences.providerCustomSolution).toBe('yes_custom')
    })
  })

  // ----------------------------------------------------------
  // SUCCESS FLOW
  // ----------------------------------------------------------

  describe('Success flow', () => {
    it('returns success with patientId from Asher Med', async () => {
      const res = await POST(makeRequest(VALID_INTAKE))
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.patientId).toBe(MOCK_PATIENT_ID)
      expect(json.message).toBe('Intake form submitted successfully')
    })

    it('sends partner note via PATCH after order creation', async () => {
      await POST(makeRequest(VALID_INTAKE))

      // getOrders called to find the new order
      expect(mockGetOrders).toHaveBeenCalledWith({ patientId: MOCK_PATIENT_ID })

      // updateOrderApproval called with order ID and partner note
      expect(mockUpdateOrderApproval).toHaveBeenCalledTimes(1)
      expect(mockUpdateOrderApproval).toHaveBeenCalledWith(
        MOCK_ORDER_ID,
        expect.objectContaining({
          approvalStatus: 'PENDING',
          partnerNote: expect.stringContaining('GOALS & MOTIVATION'),
        }),
      )
    })

    it('partner note includes all sections', async () => {
      await POST(makeRequest(VALID_INTAKE))

      const partnerNote = mockUpdateOrderApproval.mock.calls[0][1].partnerNote
      expect(partnerNote).toContain('Lose weight and improve energy')
      expect(partnerNote).toContain('Stubborn belly fat')
      expect(partnerNote).toContain('TREATMENT PREFERENCES')
      expect(partnerNote).toContain('Email')
      expect(partnerNote).toContain('CURRENT MEDICATIONS')
      expect(partnerNote).toContain('Levothyroxine')
      expect(partnerNote).toContain('catalyst')
    })

    it('updates pending_intakes and creates asher_orders in DB', async () => {
      await POST(makeRequest(VALID_INTAKE))

      // sql should be called at least twice (UPDATE pending_intakes + INSERT asher_orders)
      expect(mockSql).toHaveBeenCalled()
      const calls = mockSql.mock.calls
      expect(calls.length).toBeGreaterThanOrEqual(2)
    })
  })

  // ----------------------------------------------------------
  // ERROR HANDLING
  // ----------------------------------------------------------

  describe('Error handling', () => {
    it('returns 500 when Asher Med API fails', async () => {
      mockCreateNewOrder.mockRejectedValue(new Error('Asher Med API unreachable'))

      const res = await POST(makeRequest(VALID_INTAKE))
      const json = await res.json()

      expect(res.status).toBe(500)
      expect(json.success).toBe(false)
      expect(json.error).toContain('Unable to submit intake form')
    })

    it('succeeds even when partner note PATCH fails (non-fatal)', async () => {
      mockUpdateOrderApproval.mockRejectedValue(new Error('PATCH failed'))

      const res = await POST(makeRequest(VALID_INTAKE))
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.patientId).toBe(MOCK_PATIENT_ID)
    })

    it('succeeds even when DB update fails (non-fatal)', async () => {
      mockSql.mockRejectedValue(new Error('DB connection failed'))

      const res = await POST(makeRequest(VALID_INTAKE))
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
    })

    it('succeeds even when getOrders fails for partner note (non-fatal)', async () => {
      mockGetOrders.mockRejectedValue(new Error('getOrders failed'))

      const res = await POST(makeRequest(VALID_INTAKE))
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
    })
  })

  // ----------------------------------------------------------
  // STAGING BYPASS
  // ----------------------------------------------------------

  describe('Staging bypass', () => {
    it('returns mock patientId when ASHER_MED_API_KEY is not set', async () => {
      delete process.env.ASHER_MED_API_KEY

      const res = await POST(makeRequest(VALID_INTAKE))
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.message).toContain('staging')
      expect(json.patientId).toBeGreaterThan(0)

      // Should NOT call Asher Med API
      expect(mockCreateNewOrder).not.toHaveBeenCalled()
    })
  })

  // ----------------------------------------------------------
  // ALL 10 MEDICATIONS
  // ----------------------------------------------------------

  describe('All medication mappings', () => {
    const ALL_MEDS = [
      { id: 'semaglutide', name: 'Semaglutide', isGLP1: true },
      { id: 'tirzepatide', name: 'Tirzepatide', isGLP1: true },
      { id: 'r3ta', name: 'Other', isGLP1: true },
      { id: 'ghk-cu', name: 'GHK-Cu', isGLP1: false },
      { id: 'bpc157-tb500', name: 'BPC-157/TB-500', isGLP1: false },
      { id: 'nad-plus', name: 'NAD+', isGLP1: false },
      { id: 'tesa-ipa', name: 'Tesofensine/Ipamorelin', isGLP1: false },
      { id: 'cjc1295-ipa', name: 'CJC-1295/Ipamorelin', isGLP1: false },
      { id: 'semax-selank', name: 'Semax/Selank', isGLP1: false },
      { id: 'melanotan2', name: 'Other', isGLP1: false },
    ]

    for (const med of ALL_MEDS) {
      it(`maps ${med.id} → "${med.name}" (GLP1=${med.isGLP1})`, async () => {
        vi.clearAllMocks()
        mockCreateNewOrder.mockResolvedValue({ success: true, data: { id: MOCK_PATIENT_ID } })
        mockGetOrders.mockResolvedValue({ success: true, data: [{ id: MOCK_ORDER_ID }] })
        mockUpdateOrderApproval.mockResolvedValue({ success: true })
        mockSql.mockResolvedValue({ rows: [], rowCount: 1 })

        const body = { ...VALID_INTAKE, selectedMedications: [med.id] }
        const res = await POST(makeRequest(body))
        const json = await res.json()

        expect(json.success).toBe(true)
        const orderReq = mockCreateNewOrder.mock.calls[0][0]
        expect(orderReq.medicationPackages[0].name).toBe(med.name)
        expect(orderReq.medicationTypeSelection).toBe(med.isGLP1 ? 'GLP1' : 'NonGLP1')
      })
    }
  })
})
