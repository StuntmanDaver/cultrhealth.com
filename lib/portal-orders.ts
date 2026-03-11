import type { AsherOrderStatus } from '@/lib/asher-med-api'

// ===========================================
// TYPES
// ===========================================

export interface OrderStatusDisplay {
  label: string
  explanation: string
  color: 'amber' | 'green' | 'blue' | 'red' | 'gray'
  bgClass: string
  textClass: string
}

/**
 * Shape returned by the portal orders API routes.
 * Combines live Asher Med order data with local DB medication info.
 */
export interface PortalOrder {
  id: number
  status: AsherOrderStatus
  orderType: string | null
  doctorId: number | null
  partnerNote: string | null
  createdAt: string
  updatedAt: string
  medicationName: string
}

// ===========================================
// STATUS MAPPING
// ===========================================

const STATUS_MAP: Record<AsherOrderStatus, OrderStatusDisplay> = {
  PENDING: {
    label: 'Submitted',
    explanation: 'Your order has been received and is being processed.',
    color: 'amber',
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-800',
  },
  APPROVED: {
    label: 'Approved',
    explanation: 'Your provider approved your treatment.',
    color: 'green',
    bgClass: 'bg-green-100',
    textClass: 'text-green-800',
  },
  WaitingRoom: {
    label: 'With Provider',
    explanation: 'A provider is reviewing your information.',
    color: 'amber',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
  },
  COMPLETED: {
    label: 'Fulfilled',
    explanation: 'Your order has been shipped.',
    color: 'blue',
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-800',
  },
  DENIED: {
    label: 'Not Approved',
    explanation: 'Your provider could not approve this order. Contact support.',
    color: 'red',
    bgClass: 'bg-red-100',
    textClass: 'text-red-800',
  },
  CANCELLED: {
    label: 'Cancelled',
    explanation: 'This order was cancelled.',
    color: 'gray',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-600',
  },
}

/**
 * Get the display properties for a given Asher Med order status.
 * Returns label, explanation, color, and Tailwind CSS classes.
 * Falls back to PENDING display for unknown statuses.
 */
export function getStatusDisplay(status: AsherOrderStatus): OrderStatusDisplay {
  return STATUS_MAP[status] || STATUS_MAP.PENDING
}

// ===========================================
// ACTIVE STATUS HELPERS
// ===========================================

/**
 * Statuses considered "active" — used to identify the hero card order.
 * PENDING, APPROVED, and WaitingRoom are active.
 * COMPLETED, DENIED, and CANCELLED are terminal.
 */
export const ACTIVE_STATUSES: AsherOrderStatus[] = [
  'PENDING',
  'APPROVED',
  'WaitingRoom',
]

/**
 * Check if a given order status is active (non-terminal).
 */
export function isActiveStatus(status: AsherOrderStatus): boolean {
  return ACTIVE_STATUSES.includes(status)
}
