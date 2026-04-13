import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted ensures this is available when vi.mock factory runs (vi.mock is hoisted)
const mockContactsCreate = vi.hoisted(() => vi.fn())

vi.mock('resend', () => ({
  // Must use a regular function (not arrow) — arrow functions cannot be used with `new`
  Resend: vi.fn(function MockResend() {
    return { contacts: { create: mockContactsCreate } }
  }),
}))

process.env.RESEND_API_KEY = 'test-resend-key'
process.env.RESEND_AUDIENCE_ID = 'test-audience-123'

import { syncContactToResend, syncContactToMailchimp, addContactEvent, addTagsToContact } from '@/lib/contacts'

describe('contacts (Resend)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockContactsCreate.mockResolvedValue({ data: { id: 'contact-1' }, error: null })
    process.env.RESEND_API_KEY = 'test-resend-key'
    process.env.RESEND_AUDIENCE_ID = 'test-audience-123'
  })

  describe('syncContactToResend', () => {
    it('calls contacts.create with correct audience and email', async () => {
      await syncContactToResend({
        email: 'Jane@Test.com',
        firstName: 'Jane',
        lastName: 'Doe',
        tags: ['cultr-member'],
      })

      expect(mockContactsCreate).toHaveBeenCalledTimes(1)
      const args = mockContactsCreate.mock.calls[0][0]
      expect(args.audienceId).toBe('test-audience-123')
      expect(args.email).toBe('jane@test.com') // lowercased
      expect(args.firstName).toBe('Jane')
      expect(args.lastName).toBe('Doe')
      expect(args.unsubscribed).toBe(false)
    })

    it('skips silently when env vars not configured', async () => {
      delete process.env.RESEND_API_KEY

      await syncContactToResend({ email: 'jane@test.com', firstName: 'Jane', lastName: 'Doe' })

      expect(mockContactsCreate).not.toHaveBeenCalled()
    })

    it('does not throw on Resend API error', async () => {
      mockContactsCreate.mockResolvedValueOnce({ data: null, error: { message: 'conflict' } })

      await expect(
        syncContactToResend({ email: 'jane@test.com', firstName: 'Jane', lastName: 'Doe' })
      ).resolves.toBeUndefined()
    })

    it('does not throw on network failure', async () => {
      mockContactsCreate.mockRejectedValueOnce(new Error('network error'))

      await expect(
        syncContactToResend({ email: 'jane@test.com', firstName: 'Jane', lastName: 'Doe' })
      ).resolves.toBeUndefined()
    })
  })

  describe('syncContactToMailchimp alias', () => {
    it('is the same function as syncContactToResend', () => {
      expect(syncContactToMailchimp).toBe(syncContactToResend)
    })
  })

  describe('addContactEvent', () => {
    it('calls contacts.create with audience and normalised email', async () => {
      await addContactEvent('Jane@Test.com', ['intake-complete'])

      expect(mockContactsCreate).toHaveBeenCalledTimes(1)
      const args = mockContactsCreate.mock.calls[0][0]
      expect(args.audienceId).toBe('test-audience-123')
      expect(args.email).toBe('jane@test.com')
      expect(args.unsubscribed).toBe(false)
    })

    it('skips when env vars missing', async () => {
      delete process.env.RESEND_AUDIENCE_ID

      await addContactEvent('jane@test.com', ['labs-results-ready'])
      expect(mockContactsCreate).not.toHaveBeenCalled()
    })

    it('does not throw on API error', async () => {
      mockContactsCreate.mockResolvedValueOnce({ data: null, error: { message: 'bad request' } })

      await expect(
        addContactEvent('jane@test.com', ['labs-ordered'])
      ).resolves.toBeUndefined()
    })
  })

  describe('addTagsToContact alias', () => {
    it('is the same function as addContactEvent', () => {
      expect(addTagsToContact).toBe(addContactEvent)
    })
  })
})
