import { describe, it, expect, vi, beforeEach } from 'vitest'

// ============================================================
// MOCKS
// ============================================================

const { mockSql } = vi.hoisted(() => ({
  mockSql: vi.fn(),
}))

vi.mock('@vercel/postgres', () => ({
  sql: mockSql,
}))

const mockCreateCustomer = vi.fn()
const mockGetCustomerByExternalId = vi.fn()
const mockCreateOrder = vi.fn()
const mockCheckCreditBalance = vi.fn()

vi.mock('@/lib/siphox/client', () => ({
  createCustomer: (...args: unknown[]) => mockCreateCustomer(...args),
  getCustomerByExternalId: (...args: unknown[]) => mockGetCustomerByExternalId(...args),
  createOrder: (...args: unknown[]) => mockCreateOrder(...args),
  checkCreditBalance: (...args: unknown[]) => mockCheckCreditBalance(...args),
}))

const mockSendKitFulfillmentEmail = vi.fn()
const mockSendSiphoxRefundAlert = vi.fn()
const mockSendSiphoxFailureAlert = vi.fn()

vi.mock('@/lib/resend', () => ({
  sendKitFulfillmentEmail: (...args: unknown[]) => mockSendKitFulfillmentEmail(...args),
  sendSiphoxRefundAlert: (...args: unknown[]) => mockSendSiphoxRefundAlert(...args),
  sendSiphoxFailureAlert: (...args: unknown[]) => mockSendSiphoxFailureAlert(...args),
}))

// Import after mocks
import {
  triggerSiphoxFulfillment,
  processDeferredOrders,
  retryFailedOrders,
  notifySiphoxRefund,
} from '@/lib/siphox/fulfillment'
import { SiphoxApiError } from '@/lib/siphox/errors'

// ============================================================
// HELPERS
// ============================================================

function mockIntakeData(overrides?: Record<string, unknown>) {
  return {
    shippingAddress: {
      address1: '123 Main St',
      city: 'Gainesville',
      stateAbbreviation: 'FL',
      zipCode: '32601',
      country: 'US',
    },
    personalInfo: {
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '+13525551234',
    },
    ...overrides,
  }
}

function mockKitOrderRow(overrides?: Record<string, unknown>) {
  return {
    id: 'kit-order-uuid-1',
    siphox_customer_id: 'siphox-cust-1',
    siphox_order_id: 'siphox-ord-1',
    kit_type: 'standard_panel',
    quantity: 1,
    status: 'ordered',
    tracking_number: null,
    stripe_subscription_id: 'sub_123',
    is_test_order: false,
    fulfillment_status: 'pending_fulfillment',
    retry_count: 0,
    last_error: null,
    stripe_checkout_session_id: 'cs_test_123',
    customer_email: 'jane@example.com',
    plan_tier: 'catalyst',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }
}

// ============================================================
// TESTS: triggerSiphoxFulfillment
// ============================================================

describe('triggerSiphoxFulfillment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSql.mockReset()
  })

  it('should skip non-eligible tiers (club)', async () => {
    await triggerSiphoxFulfillment({
      customerEmail: 'test@example.com',
      planTier: 'club',
      stripeCheckoutSessionId: 'cs_test_1',
    })

    // No DB queries should have been made
    expect(mockSql).not.toHaveBeenCalled()
  })

  it('should skip non-eligible tiers (unknown)', async () => {
    await triggerSiphoxFulfillment({
      customerEmail: 'test@example.com',
      planTier: 'unknown',
      stripeCheckoutSessionId: 'cs_test_1',
    })

    expect(mockSql).not.toHaveBeenCalled()
  })

  it('should proceed for catalyst tier', async () => {
    // Idempotency check returns no existing order
    mockSql
      .mockResolvedValueOnce({ rows: [] }) // getOrderByCheckoutSession
      .mockResolvedValueOnce({ rows: [] }) // resolveMemberData (no intake)
      .mockResolvedValueOnce({ rows: [{}] }) // insertFulfillmentOrder

    await triggerSiphoxFulfillment({
      customerEmail: 'test@example.com',
      planTier: 'catalyst',
      stripeCheckoutSessionId: 'cs_test_1',
    })

    // Should have queried for existing order and intake data
    expect(mockSql).toHaveBeenCalled()
  })

  it('should proceed for concierge tier', async () => {
    mockSql
      .mockResolvedValueOnce({ rows: [] }) // getOrderByCheckoutSession
      .mockResolvedValueOnce({ rows: [] }) // resolveMemberData
      .mockResolvedValueOnce({ rows: [{}] }) // insertFulfillmentOrder

    await triggerSiphoxFulfillment({
      customerEmail: 'test@example.com',
      planTier: 'concierge',
      stripeCheckoutSessionId: 'cs_test_1',
    })

    expect(mockSql).toHaveBeenCalled()
  })

  it('should proceed for core tier (used for core with add-on)', async () => {
    mockSql
      .mockResolvedValueOnce({ rows: [] }) // getOrderByCheckoutSession
      .mockResolvedValueOnce({ rows: [] }) // resolveMemberData
      .mockResolvedValueOnce({ rows: [{}] }) // insertFulfillmentOrder

    await triggerSiphoxFulfillment({
      customerEmail: 'test@example.com',
      planTier: 'core',
      stripeCheckoutSessionId: 'cs_test_1',
    })

    expect(mockSql).toHaveBeenCalled()
  })

  it('should return early if order already exists (idempotency)', async () => {
    mockSql.mockResolvedValueOnce({
      rows: [mockKitOrderRow()], // existing order found
    })

    await triggerSiphoxFulfillment({
      customerEmail: 'test@example.com',
      planTier: 'catalyst',
      stripeCheckoutSessionId: 'cs_test_123',
    })

    // Should only have made the idempotency check query
    expect(mockSql).toHaveBeenCalledTimes(1)
    expect(mockCreateOrder).not.toHaveBeenCalled()
  })

  it('should queue as pending_intake when no intake data exists', async () => {
    mockSql
      .mockResolvedValueOnce({ rows: [] }) // getOrderByCheckoutSession -- not found
      .mockResolvedValueOnce({ rows: [] }) // resolveMemberData -- no intake data
      .mockResolvedValueOnce({ rows: [mockKitOrderRow({ fulfillment_status: 'pending_intake' })] }) // insertFulfillmentOrder

    await triggerSiphoxFulfillment({
      customerEmail: 'new@example.com',
      planTier: 'catalyst',
      stripeCheckoutSessionId: 'cs_test_new',
    })

    // Third call should be the INSERT with pending_intake
    expect(mockSql).toHaveBeenCalledTimes(3)
    expect(mockCreateOrder).not.toHaveBeenCalled()
  })

  it('should queue as needs_credits when credit balance is 0', async () => {
    mockSql
      .mockResolvedValueOnce({ rows: [] }) // getOrderByCheckoutSession
      .mockResolvedValueOnce({ rows: [{ intake_data: mockIntakeData() }] }) // resolveMemberData
      .mockResolvedValueOnce({ rows: [mockKitOrderRow({ fulfillment_status: 'needs_credits' })] }) // insertFulfillmentOrder

    mockCheckCreditBalance.mockResolvedValueOnce({ balance: 0, isLow: true })

    await triggerSiphoxFulfillment({
      customerEmail: 'jane@example.com',
      planTier: 'catalyst',
      stripeCheckoutSessionId: 'cs_test_credits',
    })

    expect(mockCheckCreditBalance).toHaveBeenCalled()
    expect(mockCreateOrder).not.toHaveBeenCalled()
  })

  it('should create customer, order, and send email on success', async () => {
    mockSql
      .mockResolvedValueOnce({ rows: [] }) // getOrderByCheckoutSession
      .mockResolvedValueOnce({ rows: [{ intake_data: mockIntakeData() }] }) // resolveMemberData
    // remaining sql calls from upsertSiphoxCustomer and insertFulfillmentOrder
    mockSql.mockResolvedValue({ rows: [mockKitOrderRow({ fulfillment_status: 'fulfilled' })] })

    mockCheckCreditBalance.mockResolvedValueOnce({ balance: 10, isLow: false })
    mockGetCustomerByExternalId.mockResolvedValueOnce(null) // no existing customer
    mockCreateCustomer.mockResolvedValueOnce({ _id: 'siphox-cust-new', first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' })
    mockCreateOrder.mockResolvedValueOnce({ _id: 'siphox-ord-new', status: 'created', kit_types: [], recipient: { first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' } })
    mockSendKitFulfillmentEmail.mockResolvedValueOnce({ success: true })

    await triggerSiphoxFulfillment({
      customerEmail: 'jane@example.com',
      planTier: 'catalyst',
      stripeCheckoutSessionId: 'cs_test_success',
    })

    expect(mockCreateCustomer).toHaveBeenCalled()
    expect(mockCreateOrder).toHaveBeenCalled()
    expect(mockSendKitFulfillmentEmail).toHaveBeenCalledWith({
      name: 'Jane',
      email: 'jane@example.com',
      address: expect.objectContaining({ street1: '123 Main St', city: 'Gainesville' }),
    })
  })

  it('should use existing SiPhox customer if found', async () => {
    mockSql
      .mockResolvedValueOnce({ rows: [] }) // getOrderByCheckoutSession
      .mockResolvedValueOnce({ rows: [{ intake_data: mockIntakeData() }] }) // resolveMemberData
    mockSql.mockResolvedValue({ rows: [mockKitOrderRow({ fulfillment_status: 'fulfilled' })] })

    mockCheckCreditBalance.mockResolvedValueOnce({ balance: 10, isLow: false })
    mockGetCustomerByExternalId.mockResolvedValueOnce({ _id: 'existing-cust-id', first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' })
    mockCreateOrder.mockResolvedValueOnce({ _id: 'siphox-ord-2', status: 'created', kit_types: [], recipient: { first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' } })
    mockSendKitFulfillmentEmail.mockResolvedValueOnce({ success: true })

    await triggerSiphoxFulfillment({
      customerEmail: 'jane@example.com',
      planTier: 'concierge',
      stripeCheckoutSessionId: 'cs_test_existing',
    })

    expect(mockCreateCustomer).not.toHaveBeenCalled()
    expect(mockCreateOrder).toHaveBeenCalled()
  })

  it('should queue as pending_fulfillment on SiPhox API error', async () => {
    mockSql
      .mockResolvedValueOnce({ rows: [] }) // getOrderByCheckoutSession
      .mockResolvedValueOnce({ rows: [{ intake_data: mockIntakeData() }] }) // resolveMemberData
    mockSql.mockResolvedValue({ rows: [mockKitOrderRow()] })

    mockCheckCreditBalance.mockResolvedValueOnce({ balance: 10, isLow: false })
    mockGetCustomerByExternalId.mockResolvedValueOnce({ _id: 'cust-1', first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' })
    mockCreateOrder.mockRejectedValueOnce(new SiphoxApiError('Service unavailable', 503))

    await triggerSiphoxFulfillment({
      customerEmail: 'jane@example.com',
      planTier: 'catalyst',
      stripeCheckoutSessionId: 'cs_test_apierror',
    })

    expect(mockSendKitFulfillmentEmail).not.toHaveBeenCalled()
  })

  it('should queue as needs_credits on 402 API error', async () => {
    mockSql
      .mockResolvedValueOnce({ rows: [] }) // getOrderByCheckoutSession
      .mockResolvedValueOnce({ rows: [{ intake_data: mockIntakeData() }] }) // resolveMemberData
    mockSql.mockResolvedValue({ rows: [mockKitOrderRow()] })

    mockCheckCreditBalance.mockResolvedValueOnce({ balance: 10, isLow: false })
    mockGetCustomerByExternalId.mockResolvedValueOnce({ _id: 'cust-1', first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' })
    mockCreateOrder.mockRejectedValueOnce(new SiphoxApiError('Payment required', 402))

    await triggerSiphoxFulfillment({
      customerEmail: 'jane@example.com',
      planTier: 'catalyst',
      stripeCheckoutSessionId: 'cs_test_402',
    })

    // Should not send fulfillment email
    expect(mockSendKitFulfillmentEmail).not.toHaveBeenCalled()
  })

  it('should never throw even on unexpected errors', async () => {
    mockSql.mockRejectedValueOnce(new Error('Database connection failed'))

    // Should not throw
    await expect(
      triggerSiphoxFulfillment({
        customerEmail: 'test@example.com',
        planTier: 'catalyst',
        stripeCheckoutSessionId: 'cs_test_crash',
      })
    ).resolves.toBeUndefined()
  })
})

// ============================================================
// TESTS: processDeferredOrders
// ============================================================

describe('processDeferredOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSql.mockReset()
  })

  it('should return zeros when no deferred orders exist', async () => {
    mockSql.mockResolvedValueOnce({ rows: [] }) // getDeferredIntakeOrders

    const result = await processDeferredOrders()

    expect(result).toEqual({ processed: 0, fulfilled: 0, stillPending: 0 })
  })

  it('should skip orders where intake data is still missing', async () => {
    mockSql
      .mockResolvedValueOnce({ rows: [mockKitOrderRow({ fulfillment_status: 'pending_intake', customer_email: 'waiting@example.com' })] }) // getDeferredIntakeOrders
      .mockResolvedValueOnce({ rows: [] }) // resolveMemberData -- still no data

    const result = await processDeferredOrders()

    expect(result).toEqual({ processed: 1, fulfilled: 0, stillPending: 1 })
  })

  it('should fulfill orders when intake data becomes available', async () => {
    mockSql
      .mockResolvedValueOnce({ rows: [mockKitOrderRow({ fulfillment_status: 'pending_intake', customer_email: 'jane@example.com' })] }) // getDeferredIntakeOrders
      .mockResolvedValueOnce({ rows: [{ intake_data: mockIntakeData() }] }) // resolveMemberData
    mockSql.mockResolvedValue({ rows: [] }) // subsequent UPDATE/INSERT calls

    mockGetCustomerByExternalId.mockResolvedValueOnce(null)
    mockCreateCustomer.mockResolvedValueOnce({ _id: 'new-cust', first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' })
    mockCreateOrder.mockResolvedValueOnce({ _id: 'new-ord', status: 'created', kit_types: [], recipient: { first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' } })
    mockSendKitFulfillmentEmail.mockResolvedValueOnce({ success: true })

    const result = await processDeferredOrders()

    expect(result.processed).toBe(1)
    expect(result.fulfilled).toBe(1)
    expect(result.stillPending).toBe(0)
    expect(mockCreateOrder).toHaveBeenCalled()
    expect(mockSendKitFulfillmentEmail).toHaveBeenCalled()
  })

  it('should move to pending_fulfillment if API fails during deferred processing', async () => {
    mockSql
      .mockResolvedValueOnce({ rows: [mockKitOrderRow({ fulfillment_status: 'pending_intake', customer_email: 'jane@example.com' })] })
      .mockResolvedValueOnce({ rows: [{ intake_data: mockIntakeData() }] })
    mockSql.mockResolvedValue({ rows: [] })

    mockGetCustomerByExternalId.mockResolvedValueOnce(null)
    mockCreateCustomer.mockRejectedValueOnce(new SiphoxApiError('API down', 500))

    const result = await processDeferredOrders()

    expect(result.processed).toBe(1)
    expect(result.fulfilled).toBe(0)
    expect(result.stillPending).toBe(0)
  })
})

// ============================================================
// TESTS: retryFailedOrders
// ============================================================

describe('retryFailedOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSql.mockReset()
  })

  it('should return zeros when no pending orders', async () => {
    mockSql.mockResolvedValueOnce({ rows: [] }) // getPendingFulfillmentOrders

    const result = await retryFailedOrders()

    expect(result).toEqual({ retried: 0, fulfilled: 0, permanentlyFailed: 0 })
  })

  it('should fulfill order on successful retry', async () => {
    const order = mockKitOrderRow({ fulfillment_status: 'pending_fulfillment', retry_count: 1, customer_email: 'jane@example.com' })
    mockSql
      .mockResolvedValueOnce({ rows: [order] }) // getPendingFulfillmentOrders
      .mockResolvedValueOnce({ rows: [{ intake_data: mockIntakeData() }] }) // resolveMemberData
    mockSql.mockResolvedValue({ rows: [] })

    mockGetCustomerByExternalId.mockResolvedValueOnce({ _id: 'cust-retry', first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' })
    mockCreateOrder.mockResolvedValueOnce({ _id: 'ord-retry', status: 'created', kit_types: [], recipient: { first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' } })
    mockSendKitFulfillmentEmail.mockResolvedValueOnce({ success: true })

    const result = await retryFailedOrders()

    expect(result).toEqual({ retried: 1, fulfilled: 1, permanentlyFailed: 0 })
    expect(mockCreateOrder).toHaveBeenCalled()
  })

  it('should increment retry count on failure', async () => {
    const order = mockKitOrderRow({ fulfillment_status: 'pending_fulfillment', retry_count: 0, customer_email: 'jane@example.com' })
    mockSql
      .mockResolvedValueOnce({ rows: [order] }) // getPendingFulfillmentOrders
      .mockResolvedValueOnce({ rows: [{ intake_data: mockIntakeData() }] }) // resolveMemberData
    mockSql.mockResolvedValue({ rows: [] })

    mockGetCustomerByExternalId.mockResolvedValueOnce({ _id: 'cust-1', first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' })
    mockCreateOrder.mockRejectedValueOnce(new SiphoxApiError('Server error', 500))

    const result = await retryFailedOrders()

    expect(result).toEqual({ retried: 1, fulfilled: 0, permanentlyFailed: 0 })
  })

  it('should mark as failed after 3rd retry and send alert', async () => {
    const order = mockKitOrderRow({
      fulfillment_status: 'pending_fulfillment',
      retry_count: 2, // This will be the 3rd attempt
      customer_email: 'jane@example.com',
      plan_tier: 'catalyst',
    })
    mockSql
      .mockResolvedValueOnce({ rows: [order] }) // getPendingFulfillmentOrders
      .mockResolvedValueOnce({ rows: [{ intake_data: mockIntakeData() }] }) // resolveMemberData
    mockSql.mockResolvedValue({ rows: [] })

    mockGetCustomerByExternalId.mockResolvedValueOnce({ _id: 'cust-1', first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' })
    mockCreateOrder.mockRejectedValueOnce(new SiphoxApiError('Persistent error', 500))
    mockSendSiphoxFailureAlert.mockResolvedValueOnce({ success: true })

    const result = await retryFailedOrders()

    expect(result).toEqual({ retried: 1, fulfilled: 0, permanentlyFailed: 1 })
    expect(mockSendSiphoxFailureAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        customerEmail: 'jane@example.com',
        retryCount: 3,
      })
    )
  })

  it('should mark as failed when member data unavailable after 3 retries', async () => {
    const order = mockKitOrderRow({
      fulfillment_status: 'pending_fulfillment',
      retry_count: 2,
      customer_email: 'missing@example.com',
      plan_tier: 'concierge',
    })
    mockSql
      .mockResolvedValueOnce({ rows: [order] }) // getPendingFulfillmentOrders
      .mockResolvedValueOnce({ rows: [] }) // resolveMemberData -- still no data
    mockSql.mockResolvedValue({ rows: [] })

    mockSendSiphoxFailureAlert.mockResolvedValueOnce({ success: true })

    const result = await retryFailedOrders()

    expect(result).toEqual({ retried: 1, fulfilled: 0, permanentlyFailed: 1 })
    expect(mockSendSiphoxFailureAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        customerEmail: 'missing@example.com',
        lastError: 'Member data not available after 3 retries',
      })
    )
  })
})

// ============================================================
// TESTS: notifySiphoxRefund
// ============================================================

describe('notifySiphoxRefund', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSql.mockReset()
  })

  it('should do nothing when no SiPhox order matches the checkout session', async () => {
    mockSql.mockResolvedValueOnce({ rows: [] }) // getOrderByCheckoutSession

    await notifySiphoxRefund({
      stripeCheckoutSessionId: 'cs_no_match',
      refundAmount: 199.00,
    })

    expect(mockSendSiphoxRefundAlert).not.toHaveBeenCalled()
  })

  it('should send refund alert with cancel suggestion for pending_intake order', async () => {
    mockSql.mockResolvedValueOnce({
      rows: [mockKitOrderRow({ fulfillment_status: 'pending_intake', plan_tier: 'catalyst' })],
    })
    mockSendSiphoxRefundAlert.mockResolvedValueOnce({ success: true })

    await notifySiphoxRefund({
      stripeCheckoutSessionId: 'cs_test_123',
      refundAmount: 499.00,
      customerEmail: 'jane@example.com',
      customerName: 'Jane Doe',
    })

    expect(mockSendSiphoxRefundAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        planTier: 'catalyst',
        refundAmount: 499.00,
        suggestedAction: expect.stringContaining('Cancel order'),
      })
    )
  })

  it('should send refund alert with return suggestion for fulfilled order', async () => {
    mockSql.mockResolvedValueOnce({
      rows: [mockKitOrderRow({ fulfillment_status: 'fulfilled', plan_tier: 'concierge' })],
    })
    mockSendSiphoxRefundAlert.mockResolvedValueOnce({ success: true })

    await notifySiphoxRefund({
      stripeCheckoutSessionId: 'cs_test_123',
      refundAmount: 1099.00,
      customerEmail: 'jane@example.com',
    })

    expect(mockSendSiphoxRefundAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        suggestedAction: expect.stringContaining('already shipped'),
      })
    )
  })

  it('should suggest no action needed for failed/needs_credits orders', async () => {
    mockSql.mockResolvedValueOnce({
      rows: [mockKitOrderRow({ fulfillment_status: 'needs_credits', plan_tier: 'catalyst' })],
    })
    mockSendSiphoxRefundAlert.mockResolvedValueOnce({ success: true })

    await notifySiphoxRefund({
      stripeCheckoutSessionId: 'cs_test_123',
      refundAmount: 499.00,
    })

    expect(mockSendSiphoxRefundAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        suggestedAction: expect.stringContaining('No SiPhox action needed'),
      })
    )
  })

  it('should never throw even on errors', async () => {
    mockSql.mockRejectedValueOnce(new Error('DB error'))

    await expect(
      notifySiphoxRefund({
        stripeCheckoutSessionId: 'cs_crash',
        refundAmount: 100,
      })
    ).resolves.toBeUndefined()
  })
})
