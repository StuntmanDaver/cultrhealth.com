import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
  isProviderEmail: vi.fn(),
}))

// Mock the healthie-api module
vi.mock('@/lib/healthie-api', () => ({
  getPatientById: vi.fn(),
  createCarePlan: vi.fn(),
  createDocument: vi.fn(),
  enrollInProgram: vi.fn(),
}))

// Mock Vercel Postgres
vi.mock('@vercel/postgres', () => ({
  sql: vi.fn(),
}))

import { POST } from '@/app/api/protocol/generate/route'
import * as auth from '@/lib/auth'
import * as healthieApi from '@/lib/healthie-api'

describe('Protocol Generate API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function createRequest(body: object): NextRequest {
    return new NextRequest('http://localhost:3000/api/protocol/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  describe('Authorization', () => {
    it('returns 401 when no session exists', async () => {
      vi.mocked(auth.getSession).mockResolvedValue(null)

      const request = createRequest({
        templateId: 'glp1-standard',
        patientHealthieId: 'patient-123',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 401 when email is not in provider allowlist', async () => {
      vi.mocked(auth.getSession).mockResolvedValue({
        email: 'patient@example.com',
        customerId: 'cus_123',
      })
      vi.mocked(auth.isProviderEmail).mockReturnValue(false)

      const request = createRequest({
        templateId: 'glp1-standard',
        patientHealthieId: 'patient-123',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('Validation', () => {
    beforeEach(() => {
      vi.mocked(auth.getSession).mockResolvedValue({
        email: 'provider@cultrhealth.com',
        customerId: 'cus_123',
      })
      vi.mocked(auth.isProviderEmail).mockReturnValue(true)
      vi.mocked(healthieApi.getPatientById).mockResolvedValue({ id: 'patient-123' })
    })

    it('returns 400 when templateId is missing', async () => {
      const request = createRequest({
        patientHealthieId: 'patient-123',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Template/Symptoms and patientHealthieId are required')
    })

    it('returns 400 when patientHealthieId is missing', async () => {
      const request = createRequest({
        templateId: 'glp1-standard',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Template/Symptoms and patientHealthieId are required')
    })

    it('returns 400 for invalid template ID', async () => {
      const request = createRequest({
        templateId: 'non-existent-template',
        patientHealthieId: 'patient-123',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid protocol template')
    })
  })

  describe('Healthie Integration', () => {
    beforeEach(() => {
      vi.mocked(auth.getSession).mockResolvedValue({
        email: 'provider@cultrhealth.com',
        customerId: 'cus_123',
      })
      vi.mocked(auth.isProviderEmail).mockReturnValue(true)
    })

    it('returns 404 when patient is not found in Healthie', async () => {
      vi.mocked(healthieApi.getPatientById).mockResolvedValue(null)

      const request = createRequest({
        templateId: 'glp1-standard',
        patientHealthieId: 'invalid-patient',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Patient not found')
    })

    it('creates care plan and documents on success', async () => {
      vi.mocked(healthieApi.getPatientById).mockResolvedValue({ id: 'patient-123' })
      vi.mocked(healthieApi.createCarePlan).mockResolvedValue({
        id: 'careplan-456',
        name: 'GLP-1 Standard Protocol',
      })
      vi.mocked(healthieApi.createDocument).mockResolvedValue({
        id: 'doc-789',
        displayName: 'Protocol Summary',
      })

      const request = createRequest({
        templateId: 'glp1-standard',
        patientHealthieId: 'patient-123',
        parameters: {
          startingDose: 0.25,
          targetDose: 1.0,
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.carePlanId).toBe('careplan-456')

      // Verify care plan was created
      expect(healthieApi.createCarePlan).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'GLP-1 Standard Protocol',
          patientId: 'patient-123',
        })
      )

      // Verify documents were created
      expect(healthieApi.createDocument).toHaveBeenCalled()
    })

    it('enrolls in program when courseMembershipId is provided', async () => {
      vi.mocked(healthieApi.getPatientById).mockResolvedValue({ id: 'patient-123' })
      vi.mocked(healthieApi.createCarePlan).mockResolvedValue({
        id: 'careplan-456',
        name: 'GLP-1 Standard Protocol',
      })
      vi.mocked(healthieApi.createDocument).mockResolvedValue({
        id: 'doc-789',
        displayName: 'Protocol Summary',
      })
      vi.mocked(healthieApi.enrollInProgram).mockResolvedValue({ id: 'enrollment-999' })

      const request = createRequest({
        templateId: 'glp1-standard',
        patientHealthieId: 'patient-123',
        courseMembershipId: 'membership-abc',
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(healthieApi.enrollInProgram).toHaveBeenCalledWith({
        courseMembershipId: 'membership-abc',
      })
    })

    it('handles Healthie API errors gracefully', async () => {
      vi.mocked(healthieApi.getPatientById).mockResolvedValue({ id: 'patient-123' })
      vi.mocked(healthieApi.createCarePlan).mockRejectedValue(new Error('Healthie API error'))

      const request = createRequest({
        templateId: 'glp1-standard',
        patientHealthieId: 'patient-123',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Healthie API error')
    })
  })

  describe('Parameter Handling', () => {
    beforeEach(() => {
      vi.mocked(auth.getSession).mockResolvedValue({
        email: 'provider@cultrhealth.com',
        customerId: 'cus_123',
      })
      vi.mocked(auth.isProviderEmail).mockReturnValue(true)
      vi.mocked(healthieApi.getPatientById).mockResolvedValue({ id: 'patient-123' })
      vi.mocked(healthieApi.createCarePlan).mockResolvedValue({
        id: 'careplan-456',
        name: 'GLP-1 Standard Protocol',
      })
      vi.mocked(healthieApi.createDocument).mockResolvedValue({
        id: 'doc-789',
        displayName: 'Protocol Summary',
      })
    })

    it('uses default parameters when none provided', async () => {
      const request = createRequest({
        templateId: 'glp1-standard',
        patientHealthieId: 'patient-123',
        parameters: {},
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      // The protocol should be generated with default values
      expect(healthieApi.createCarePlan).toHaveBeenCalled()
    })

    it('accepts custom parameters', async () => {
      const request = createRequest({
        templateId: 'glp1-standard',
        patientHealthieId: 'patient-123',
        parameters: {
          startingDose: 0.5,
          targetDose: 2.0,
          titrationWeeks: 6,
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Symptom Stack Generation', () => {
    beforeEach(() => {
      vi.mocked(auth.getSession).mockResolvedValue({
        email: 'provider@cultrhealth.com',
        customerId: 'cus_123',
      })
      vi.mocked(auth.isProviderEmail).mockReturnValue(true)
      vi.mocked(healthieApi.getPatientById).mockResolvedValue({ id: 'patient-123' })
      vi.mocked(healthieApi.createCarePlan).mockResolvedValue({
        id: 'careplan-symptom',
        name: 'Custom Protocol: Anxiety...',
      })
      vi.mocked(healthieApi.createDocument).mockResolvedValue({
        id: 'doc-symptom',
        displayName: 'Custom Protocol Instructions',
      })
    })

    it('generates protocol from symptom IDs', async () => {
      const request = createRequest({
        symptomIds: ['anxiety', 'insomnia'],
        patientHealthieId: 'patient-123',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.carePlanId).toBe('careplan-symptom')

      // Verify care plan creation
      expect(healthieApi.createCarePlan).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.stringContaining('Custom Protocol'),
          patientId: 'patient-123',
        })
      )

      // Verify document creation with combined content
      expect(healthieApi.createDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Custom Protocol Instructions',
          patientId: 'patient-123',
          content: expect.stringContaining('CUSTOM PROTOCOL FOR: Anxiety, Insomnia'),
        })
      )
    })

    it('returns 400 for invalid symptoms', async () => {
      const request = createRequest({
        symptomIds: ['invalid-symptom-id'],
        patientHealthieId: 'patient-123',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid symptoms')
    })
  })
})
