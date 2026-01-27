import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock global fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Healthie API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.HEALTHIE_API_KEY = 'test-api-key'
    process.env.HEALTHIE_API_URL = 'https://staging-api.gethealthie.com/graphql'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Import after setting up mocks
  const importHealthieApi = async () => {
    // Clear module cache to pick up new env vars
    vi.resetModules()
    return await import('@/lib/healthie-api')
  }

  describe('getPatientById', () => {
    it('returns patient when found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            user: {
              id: 'patient-123',
              is_patient: true,
            },
          },
        }),
      })

      const { getPatientById } = await importHealthieApi()
      const patient = await getPatientById('patient-123')

      expect(patient).toEqual({ id: 'patient-123' })
      expect(mockFetch).toHaveBeenCalledWith(
        'https://staging-api.gethealthie.com/graphql',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            authorization: 'Basic test-api-key',
            AuthorizationSource: 'API',
          }),
        })
      )
    })

    it('returns null when patient not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            user: null,
          },
        }),
      })

      const { getPatientById } = await importHealthieApi()
      const patient = await getPatientById('invalid-id')

      expect(patient).toBeNull()
    })

    it('returns null when user is not a patient', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            user: {
              id: 'provider-123',
              is_patient: false,
            },
          },
        }),
      })

      const { getPatientById } = await importHealthieApi()
      const patient = await getPatientById('provider-123')

      expect(patient).toBeNull()
    })

    it('throws error when API returns errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          errors: [{ message: 'Invalid user ID' }],
        }),
      })

      const { getPatientById } = await importHealthieApi()
      
      await expect(getPatientById('bad-id')).rejects.toThrow('Invalid user ID')
    })
  })

  describe('createCarePlan', () => {
    it('creates care plan successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            createCarePlan: {
              carePlan: {
                id: 'careplan-456',
                name: 'Test Protocol',
              },
            },
          },
        }),
      })

      const { createCarePlan } = await importHealthieApi()
      const carePlan = await createCarePlan({
        name: 'Test Protocol',
        patientId: 'patient-123',
      })

      expect(carePlan).toEqual({
        id: 'careplan-456',
        name: 'Test Protocol',
      })
    })

    it('throws error when patientId missing for non-template', async () => {
      const { createCarePlan } = await importHealthieApi()

      await expect(
        createCarePlan({
          name: 'Test Protocol',
        })
      ).rejects.toThrow('patientId is required')
    })

    it('allows creating template without patientId', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            createCarePlan: {
              carePlan: {
                id: 'template-789',
                name: 'Template Protocol',
              },
            },
          },
        }),
      })

      const { createCarePlan } = await importHealthieApi()
      const carePlan = await createCarePlan({
        name: 'Template Protocol',
        isTemplate: true,
      })

      expect(carePlan.id).toBe('template-789')
    })

    it('throws error when creation fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            createCarePlan: {
              carePlan: null,
            },
          },
        }),
      })

      const { createCarePlan } = await importHealthieApi()

      await expect(
        createCarePlan({
          name: 'Test Protocol',
          patientId: 'patient-123',
        })
      ).rejects.toThrow('Failed to create care plan')
    })
  })

  describe('createDocument', () => {
    it('creates document successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            createDocument: {
              document: {
                id: 'doc-123',
                display_name: 'Protocol Summary',
              },
            },
          },
        }),
      })

      const { createDocument } = await importHealthieApi()
      const doc = await createDocument({
        title: 'Protocol Summary',
        content: 'This is the protocol content.',
        patientId: 'patient-123',
      })

      expect(doc).toEqual({
        id: 'doc-123',
        displayName: 'Protocol Summary',
      })
    })

    it('includes carePlanId when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            createDocument: {
              document: {
                id: 'doc-456',
                display_name: 'Attached Doc',
              },
            },
          },
        }),
      })

      const { createDocument } = await importHealthieApi()
      await createDocument({
        title: 'Attached Doc',
        content: 'Content',
        patientId: 'patient-123',
        carePlanId: 'careplan-789',
      })

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.variables.input.care_plan_id).toBe('careplan-789')
    })

    it('throws error when creation fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            createDocument: {
              document: null,
            },
          },
        }),
      })

      const { createDocument } = await importHealthieApi()

      await expect(
        createDocument({
          title: 'Test',
          content: 'Content',
          patientId: 'patient-123',
        })
      ).rejects.toThrow('Failed to create document')
    })
  })

  describe('enrollInProgram', () => {
    it('enrolls in program successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            updateCourseMembership: {
              courseMembership: {
                id: 'membership-123',
              },
            },
          },
        }),
      })

      const { enrollInProgram } = await importHealthieApi()
      const result = await enrollInProgram({
        courseMembershipId: 'membership-123',
      })

      expect(result).toEqual({ id: 'membership-123' })
    })

    it('includes startAt when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            updateCourseMembership: {
              courseMembership: {
                id: 'membership-123',
              },
            },
          },
        }),
      })

      const { enrollInProgram } = await importHealthieApi()
      await enrollInProgram({
        courseMembershipId: 'membership-123',
        startAt: '2026-02-01',
      })

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.variables.input.start_at).toBe('2026-02-01')
    })

    it('throws error when enrollment fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            updateCourseMembership: {
              courseMembership: null,
            },
          },
        }),
      })

      const { enrollInProgram } = await importHealthieApi()

      await expect(
        enrollInProgram({
          courseMembershipId: 'bad-id',
        })
      ).rejects.toThrow('Failed to update program enrollment')
    })
  })

  describe('API Key Validation', () => {
    it('throws error when API key is not configured', async () => {
      delete process.env.HEALTHIE_API_KEY

      vi.resetModules()
      const { getPatientById } = await import('@/lib/healthie-api')

      await expect(getPatientById('patient-123')).rejects.toThrow(
        'HEALTHIE_API_KEY is not configured'
      )
    })
  })
})
