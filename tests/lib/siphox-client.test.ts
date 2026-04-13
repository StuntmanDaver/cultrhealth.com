import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock @/lib/resend before importing the client
vi.mock('@/lib/resend', () => ({
  sendLowCreditAlert: vi.fn().mockResolvedValue({ success: true }),
}))

import {
  createCustomer,
  getCustomerByExternalId,
  createOrder,
  getOrder,
  validateKit,
  getReport,
  getBiomarkers,
  checkCreditBalance,
  isSiphoxConfigured,
} from '@/lib/siphox/client'
import { SiphoxApiError } from '@/lib/siphox/errors'

// ============================================================
// SETUP
// ============================================================

const mockFetch = vi.fn()
const originalFetch = globalThis.fetch

beforeEach(() => {
  globalThis.fetch = mockFetch
  mockFetch.mockReset()
  // Ensure env vars are set for tests
  process.env.SIPHOX_API_KEY = 'test-siphox-key'
  process.env.SIPHOX_API_URL = 'https://connect.siphoxhealth.com/api/v1'
})

afterEach(() => {
  globalThis.fetch = originalFetch
  // Restore env vars
  process.env.SIPHOX_API_KEY = 'test-siphox-key'
  process.env.SIPHOX_API_URL = 'https://connect.siphoxhealth.com/api/v1'
})

// Helper to create a mock Response
function mockResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    headers: new Headers({ 'content-type': 'application/json' }),
  } as Response
}

// ============================================================
// siphoxRequest internals
// ============================================================

describe('siphoxRequest (via createCustomer)', () => {
  it('sends correct Authorization Bearer header', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({
        _id: 'cust_123',
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
      })
    )

    await createCustomer({
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      phone: '+14155551234',
      external_id: '+14155551234',
    })

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, options] = mockFetch.mock.calls[0]
    expect(options.headers['Authorization']).toBe('Bearer test-siphox-key')
  })

  it('sends correct URL (base URL + endpoint)', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({
        _id: 'cust_123',
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
      })
    )

    await createCustomer({
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      phone: '+14155551234',
      external_id: '+14155551234',
    })

    const [url] = mockFetch.mock.calls[0]
    expect(url).toBe('https://connect.siphoxhealth.com/api/v1/customer')
  })

  it('throws SiphoxApiError when SIPHOX_API_KEY is unset', async () => {
    delete process.env.SIPHOX_API_KEY

    await expect(
      createCustomer({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        phone: '+14155551234',
        external_id: '+14155551234',
      })
    ).rejects.toThrow(SiphoxApiError)

    await expect(
      createCustomer({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        phone: '+14155551234',
        external_id: '+14155551234',
      })
    ).rejects.toThrow('SIPHOX_API_KEY is not configured')
  })

  it('throws SiphoxApiError on non-ok HTTP response (500)', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ message: 'Internal server error' }, 500)
    )

    await expect(
      createCustomer({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        phone: '+14155551234',
        external_id: '+14155551234',
      })
    ).rejects.toThrow(SiphoxApiError)
  })

  it('throws SiphoxApiError on Zod validation failure (missing required fields)', async () => {
    // Return a response that's missing required fields for the customer schema
    mockFetch.mockResolvedValueOnce(
      mockResponse({ name: 'not-a-valid-customer' })
    )

    await expect(
      createCustomer({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        phone: '+14155551234',
        external_id: '+14155551234',
      })
    ).rejects.toThrow(SiphoxApiError)
  })
})

// ============================================================
// Endpoint functions
// ============================================================

describe('createCustomer', () => {
  it('sends POST with correct body', async () => {
    const customerRequest = {
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      phone: '+14155551234',
      external_id: '+14155551234',
      address: {
        street1: '123 Main St',
        city: 'Gainesville',
        state: 'FL',
        zip: '32601',
        country: 'US',
      },
    }

    mockFetch.mockResolvedValueOnce(
      mockResponse({
        _id: 'cust_new',
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        phone: '+14155551234',
        external_id: '+14155551234',
      })
    )

    const result = await createCustomer(customerRequest)

    const [, options] = mockFetch.mock.calls[0]
    expect(options.method).toBe('POST')
    const body = JSON.parse(options.body)
    expect(body.first_name).toBe('Jane')
    expect(body.last_name).toBe('Doe')
    expect(body.email).toBe('jane@example.com')
    expect(body.external_id).toBe('+14155551234')
    expect(body.address.street1).toBe('123 Main St')
    expect(result._id).toBe('cust_new')
  })
})

describe('getCustomerByExternalId', () => {
  it('returns customer when found', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({
        _id: 'cust_found',
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        external_id: '+14155551234',
      })
    )

    const result = await getCustomerByExternalId('+14155551234')
    expect(result).not.toBeNull()
    expect(result!._id).toBe('cust_found')
  })

  it('returns null on 404', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ message: 'Not found' }, 404)
    )

    const result = await getCustomerByExternalId('+14155551234')
    expect(result).toBeNull()
  })
})

describe('getOrder', () => {
  it('sends GET to correct endpoint', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({
        _id: 'ord_123',
        status: 'created',
        kit_types: [{ kitType: 'longevity_essentials', quantity: 1 }],
        recipient: {
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'jane@example.com',
        },
      })
    )

    await getOrder('ord_123')

    const [url] = mockFetch.mock.calls[0]
    expect(url).toBe('https://connect.siphoxhealth.com/api/v1/orders/ord_123')
  })
})

describe('checkCreditBalance', () => {
  it('returns { balance, isLow: true } when balance is 3 and calls sendLowCreditAlert', async () => {
    const { sendLowCreditAlert } = await import('@/lib/resend')

    mockFetch.mockResolvedValueOnce(mockResponse({ balance: 3 }))

    const result = await checkCreditBalance()

    expect(result.balance).toBe(3)
    expect(result.isLow).toBe(true)
    expect(sendLowCreditAlert).toHaveBeenCalledWith(3, 5)
  })

  it('returns { balance, isLow: false } when balance is 10 and does NOT call sendLowCreditAlert', async () => {
    const { sendLowCreditAlert } = await import('@/lib/resend')
    vi.mocked(sendLowCreditAlert).mockClear()

    mockFetch.mockResolvedValueOnce(mockResponse({ balance: 10 }))

    const result = await checkCreditBalance()

    expect(result.balance).toBe(10)
    expect(result.isLow).toBe(false)
    expect(sendLowCreditAlert).not.toHaveBeenCalled()
  })
})

describe('isSiphoxConfigured', () => {
  it('returns true when SIPHOX_API_KEY is set', () => {
    process.env.SIPHOX_API_KEY = 'test-key'
    expect(isSiphoxConfigured()).toBe(true)
  })

  it('returns false when SIPHOX_API_KEY is not set', () => {
    delete process.env.SIPHOX_API_KEY
    expect(isSiphoxConfigured()).toBe(false)
  })

  it('returns false when SIPHOX_API_KEY is empty string', () => {
    process.env.SIPHOX_API_KEY = ''
    expect(isSiphoxConfigured()).toBe(false)
  })
})
