// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('createInvoice', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.QUICKBOOKS_REALM_ID = 'realm_123'
    process.env.QUICKBOOKS_SANDBOX = 'true'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.QUICKBOOKS_REALM_ID
    delete process.env.QUICKBOOKS_SANDBOX
  })

  it('uses the customer-facing discount label on QuickBooks invoice lines', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          Invoice: {
            Id: 'invoice_123',
            InvoiceLink: 'https://pay.example/invoice_123',
            TotalAmt: 90,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    )
    vi.stubGlobal('fetch', fetchMock)

    const { createInvoice } = await import('@/lib/quickbooks')

    const result = await createInvoice(
      'access_token_123',
      'customer_123',
      [
        {
          therapyId: 'semaglutide',
          name: 'Semaglutide',
          price: 100,
          quantity: 1,
        },
      ],
      'CLB-TEST',
      10,
      'New customer discount'
    )

    expect(result?.invoiceId).toBe('invoice_123')
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const requestBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))
    expect(requestBody.Line).toContainEqual(
      expect.objectContaining({
        Amount: -10,
        Description: 'New customer discount (10% off)',
      })
    )
  })
})
