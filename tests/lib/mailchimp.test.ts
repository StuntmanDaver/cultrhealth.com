import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

process.env.MAILCHIMP_API_KEY = 'test-api-key-us1'
process.env.MAILCHIMP_AUDIENCE_ID = 'test-audience-123'
process.env.MAILCHIMP_SERVER_PREFIX = 'us1'

import { getEmailHash, syncContactToMailchimp, addTagsToContact } from '@/lib/mailchimp'

describe('mailchimp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })
    // Restore env vars in case a test deleted them
    process.env.MAILCHIMP_API_KEY = 'test-api-key-us1'
    process.env.MAILCHIMP_AUDIENCE_ID = 'test-audience-123'
    process.env.MAILCHIMP_SERVER_PREFIX = 'us1'
  })

  describe('getEmailHash', () => {
    it('returns MD5 hash of lowercase email', () => {
      const hash = getEmailHash('Test@Example.com')
      expect(hash).toBe(getEmailHash('test@example.com'))
      expect(hash).toMatch(/^[a-f0-9]{32}$/)
    })

    it('trims whitespace before hashing', () => {
      expect(getEmailHash('  test@example.com  ')).toBe(getEmailHash('test@example.com'))
    })
  })

  describe('syncContactToMailchimp', () => {
    it('sends PUT request with correct URL and auth', async () => {
      await syncContactToMailchimp({
        email: 'jane@test.com',
        firstName: 'Jane',
        lastName: 'Doe',
        tags: ['club-member'],
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toContain('https://us1.api.mailchimp.com/3.0/lists/test-audience-123/members/')
      expect(options.method).toBe('PUT')
      expect(options.headers['Content-Type']).toBe('application/json')
      expect(options.headers['Authorization']).toContain('Basic ')
    })

    it('includes merge fields and tags in body', async () => {
      await syncContactToMailchimp({
        email: 'jane@test.com',
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '+15551234567',
        tags: ['club-order-placed', 'therapy-semaglutide'],
        mergeFields: { THERAPY: 'Semaglutide', ORDER_NUM: 'CLB-ABC123' },
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.email_address).toBe('jane@test.com')
      expect(body.status_if_new).toBe('subscribed')
      expect(body.merge_fields.FNAME).toBe('Jane')
      expect(body.merge_fields.LNAME).toBe('Doe')
      expect(body.merge_fields.PHONE).toBe('+15551234567')
      expect(body.merge_fields.THERAPY).toBe('Semaglutide')
      expect(body.merge_fields.ORDER_NUM).toBe('CLB-ABC123')
      expect(body.tags).toEqual(['club-order-placed', 'therapy-semaglutide'])
    })

    it('skips silently when env vars not configured', async () => {
      delete process.env.MAILCHIMP_API_KEY

      await syncContactToMailchimp({
        email: 'jane@test.com',
        firstName: 'Jane',
        lastName: 'Doe',
        tags: ['test'],
      })

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('does not throw on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Invalid resource' }),
      })

      await syncContactToMailchimp({
        email: 'jane@test.com',
        firstName: 'Jane',
        lastName: 'Doe',
        tags: ['test'],
      })
    })
  })

  describe('addTagsToContact', () => {
    it('sends POST to tags endpoint with active status', async () => {
      await addTagsToContact('jane@test.com', ['intake-complete'])

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toContain('/tags')
      const body = JSON.parse(options.body)
      expect(body.tags).toEqual([{ name: 'intake-complete', status: 'active' }])
    })

    it('handles multiple tags', async () => {
      await addTagsToContact('jane@test.com', ['labs-results-ready', 'tier-core'])

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.tags).toEqual([
        { name: 'labs-results-ready', status: 'active' },
        { name: 'tier-core', status: 'active' },
      ])
    })

    it('skips when env vars missing', async () => {
      delete process.env.MAILCHIMP_API_KEY

      await addTagsToContact('jane@test.com', ['test'])
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })
})
