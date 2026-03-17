import { describe, it, expect } from 'vitest'
import { deriveKitLifecycleState, KIT_LIFECYCLE_STAGES } from '@/lib/siphox/kit-lifecycle'
import type { SiphoxKitOrderRow } from '@/lib/siphox/db'

function makeOrder(overrides: Partial<SiphoxKitOrderRow> = {}): SiphoxKitOrderRow {
  return {
    id: 'test-id',
    siphox_customer_id: 'cust-1',
    siphox_order_id: 'order-1',
    kit_type: 'basic_panel',
    quantity: 1,
    status: 'ordered',
    tracking_number: null,
    stripe_subscription_id: null,
    is_test_order: false,
    fulfillment_status: 'pending_fulfillment',
    retry_count: 0,
    last_error: null,
    stripe_checkout_session_id: null,
    customer_email: null,
    plan_tier: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }
}

describe('KIT_LIFECYCLE_STAGES', () => {
  it('has exactly 7 entries', () => {
    expect(KIT_LIFECYCLE_STAGES).toHaveLength(7)
  })

  it('has entries in correct order', () => {
    const keys = KIT_LIFECYCLE_STAGES.map((s) => s.key)
    expect(keys).toEqual([
      'no_kit',
      'ordered',
      'shipped',
      'registered',
      'sample_mailed',
      'processing',
      'results_ready',
    ])
  })

  it('all entries have required fields', () => {
    for (const stage of KIT_LIFECYCLE_STAGES) {
      expect(stage.key).toBeTruthy()
      expect(stage.label).toBeTruthy()
      expect(stage.description).toBeTruthy()
    }
  })
})

describe('deriveKitLifecycleState', () => {
  it('returns ordered for fulfillment_status pending_intake', () => {
    expect(deriveKitLifecycleState(makeOrder({ fulfillment_status: 'pending_intake' }))).toBe('ordered')
  })

  it('returns ordered for fulfillment_status pending_fulfillment', () => {
    expect(deriveKitLifecycleState(makeOrder({ fulfillment_status: 'pending_fulfillment' }))).toBe('ordered')
  })

  it('returns ordered for fulfillment_status needs_credits', () => {
    expect(deriveKitLifecycleState(makeOrder({ fulfillment_status: 'needs_credits' }))).toBe('ordered')
  })

  it('returns ordered for fulfillment_status fulfilled without tracking_number', () => {
    expect(deriveKitLifecycleState(makeOrder({ fulfillment_status: 'fulfilled', tracking_number: null }))).toBe('ordered')
  })

  it('returns shipped for fulfillment_status fulfilled with tracking_number', () => {
    expect(deriveKitLifecycleState(makeOrder({ fulfillment_status: 'fulfilled', tracking_number: 'TRACK123' }))).toBe('shipped')
  })

  it('returns registered for status registered', () => {
    expect(deriveKitLifecycleState(makeOrder({ status: 'registered', fulfillment_status: 'fulfilled' }))).toBe('registered')
  })

  it('returns sample_mailed for status sample_mailed', () => {
    expect(deriveKitLifecycleState(makeOrder({ status: 'sample_mailed', fulfillment_status: 'fulfilled' }))).toBe('sample_mailed')
  })

  it('returns processing for status processing', () => {
    expect(deriveKitLifecycleState(makeOrder({ status: 'processing', fulfillment_status: 'fulfilled' }))).toBe('processing')
  })

  it('returns results_ready for status results_ready', () => {
    expect(deriveKitLifecycleState(makeOrder({ status: 'results_ready', fulfillment_status: 'fulfilled' }))).toBe('results_ready')
  })
})
