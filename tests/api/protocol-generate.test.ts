import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
  isProviderEmail: vi.fn(),
}))

// Mock the asher-med-api module
vi.mock('@/lib/asher-med-api', () => ({
  getPatientById: vi.fn(),
}))

// Mock Vercel Postgres
vi.mock('@vercel/postgres', () => ({
  sql: vi.fn(),
}))

import { POST } from '@/app/api/protocol/generate/route'
import * as auth from '@/lib/auth'
import * as asherApi from '@/lib/asher-med-api'

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
        patientId: '123',
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
        patientId: '123',
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
      vi.mocked(asherApi.getPatientById).mockResolvedValue({ id: 123 } as any)
    })

    it('returns 400 when templateId is missing', async () => {
      const request = createRequest({
        patientId: '123',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Template/Symptoms and patientId are required')
    })

    it('returns 400 when patientId is missing', async () => {
      const request = createRequest({
        templateId: 'glp1-standard',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Template/Symptoms and patientId are required')
    })

    it('returns 400 for invalid template ID', async () => {
      const request = createRequest({
        templateId: 'non-existent-template',
        patientId: '123',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid protocol template')
    })
  })

  describe('Asher Med Integration', () => {
    beforeEach(() => {
      vi.mocked(auth.getSession).mockResolvedValue({
        email: 'provider@cultrhealth.com',
        customerId: 'cus_123',
      })
      vi.mocked(auth.isProviderEmail).mockReturnValue(true)
    })

    it('returns 404 when patient is not found', async () => {
      vi.mocked(asherApi.getPatientById).mockResolvedValue(null as any)

      const request = createRequest({
        templateId: 'glp1-standard',
        patientId: '999',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Patient not found')
    })

    it('generates protocol and stores in DB on success', async () => {
      vi.mocked(asherApi.getPatientById).mockResolvedValue({ id: 123 } as any)

      const request = createRequest({
        templateId: 'glp1-standard',
        patientId: '123',
        parameters: {
          startingDose: 0.25,
          targetDose: 1.0,
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.protocolName).toBe('GLP-1 Standard Protocol')
    })

    it('handles API errors gracefully', async () => {
      vi.mocked(asherApi.getPatientById).mockRejectedValue(new Error('Asher Med API error'))

      const request = createRequest({
        templateId: 'glp1-standard',
        patientId: '123',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Asher Med API error')
    })
  })

  describe('Parameter Handling', () => {
    beforeEach(() => {
      vi.mocked(auth.getSession).mockResolvedValue({
        email: 'provider@cultrhealth.com',
        customerId: 'cus_123',
      })
      vi.mocked(auth.isProviderEmail).mockReturnValue(true)
      vi.mocked(asherApi.getPatientById).mockResolvedValue({ id: 123 } as any)
    })

    it('uses default parameters when none provided', async () => {
      const request = createRequest({
        templateId: 'glp1-standard',
        patientId: '123',
        parameters: {},
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('accepts custom parameters', async () => {
      const request = createRequest({
        templateId: 'glp1-standard',
        patientId: '123',
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
      vi.mocked(asherApi.getPatientById).mockResolvedValue({ id: 123 } as any)
    })

    it('generates protocol from symptom IDs', async () => {
      const request = createRequest({
        symptomIds: ['anxiety', 'insomnia'],
        patientId: '123',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('returns 400 for invalid symptoms', async () => {
      const request = createRequest({
        symptomIds: ['invalid-symptom-id'],
        patientId: '123',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid symptoms')
    })
  })
})
