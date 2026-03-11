// @vitest-environment node
import { describe, it, expect } from 'vitest'

import {
  getStatusDisplay,
  isActiveStatus,
  ACTIVE_STATUSES,
} from '@/lib/portal-orders'
import type { AsherOrderStatus } from '@/lib/asher-med-api'

// --------------------------------------------------
// getStatusDisplay
// --------------------------------------------------

describe('getStatusDisplay', () => {
  it('maps PENDING to Submitted with amber colors', () => {
    const display = getStatusDisplay('PENDING')
    expect(display).toEqual({
      label: 'Submitted',
      explanation: 'Your order has been received and is being processed.',
      color: 'amber',
      bgClass: 'bg-amber-100',
      textClass: 'text-amber-800',
    })
  })

  it('maps APPROVED to Approved with green colors', () => {
    const display = getStatusDisplay('APPROVED')
    expect(display).toEqual({
      label: 'Approved',
      explanation: 'Your provider approved your treatment.',
      color: 'green',
      bgClass: 'bg-green-100',
      textClass: 'text-green-800',
    })
  })

  it('maps WaitingRoom to With Provider with amber colors', () => {
    const display = getStatusDisplay('WaitingRoom')
    expect(display).toEqual({
      label: 'With Provider',
      explanation: 'A provider is reviewing your information.',
      color: 'amber',
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-700',
    })
  })

  it('maps COMPLETED to Fulfilled with blue colors', () => {
    const display = getStatusDisplay('COMPLETED')
    expect(display).toEqual({
      label: 'Fulfilled',
      explanation: 'Your order has been shipped.',
      color: 'blue',
      bgClass: 'bg-blue-100',
      textClass: 'text-blue-800',
    })
  })

  it('maps DENIED to Not Approved with red colors', () => {
    const display = getStatusDisplay('DENIED')
    expect(display).toEqual({
      label: 'Not Approved',
      explanation: 'Your provider could not approve this order. Contact support.',
      color: 'red',
      bgClass: 'bg-red-100',
      textClass: 'text-red-800',
    })
  })

  it('maps CANCELLED to Cancelled with gray colors', () => {
    const display = getStatusDisplay('CANCELLED')
    expect(display).toEqual({
      label: 'Cancelled',
      explanation: 'This order was cancelled.',
      color: 'gray',
      bgClass: 'bg-gray-100',
      textClass: 'text-gray-600',
    })
  })

  it('falls back to PENDING display for unknown status', () => {
    const display = getStatusDisplay('UNKNOWN_STATUS' as AsherOrderStatus)
    expect(display).toEqual({
      label: 'Submitted',
      explanation: 'Your order has been received and is being processed.',
      color: 'amber',
      bgClass: 'bg-amber-100',
      textClass: 'text-amber-800',
    })
  })
})

// --------------------------------------------------
// isActiveStatus
// --------------------------------------------------

describe('isActiveStatus', () => {
  it('returns true for PENDING', () => {
    expect(isActiveStatus('PENDING')).toBe(true)
  })

  it('returns true for APPROVED', () => {
    expect(isActiveStatus('APPROVED')).toBe(true)
  })

  it('returns true for WaitingRoom', () => {
    expect(isActiveStatus('WaitingRoom')).toBe(true)
  })

  it('returns false for COMPLETED', () => {
    expect(isActiveStatus('COMPLETED')).toBe(false)
  })

  it('returns false for DENIED', () => {
    expect(isActiveStatus('DENIED')).toBe(false)
  })

  it('returns false for CANCELLED', () => {
    expect(isActiveStatus('CANCELLED')).toBe(false)
  })
})

// --------------------------------------------------
// ACTIVE_STATUSES
// --------------------------------------------------

describe('ACTIVE_STATUSES', () => {
  it('contains exactly PENDING, APPROVED, and WaitingRoom', () => {
    expect(ACTIVE_STATUSES).toEqual(['PENDING', 'APPROVED', 'WaitingRoom'])
  })
})
