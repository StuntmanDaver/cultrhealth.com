/** Order status from pharmacy/fulfillment partner */
type OrderStatus = string

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
 */
export interface PortalOrder {
  id: number | string
  status: OrderStatus
  orderType: string | null
  doctorId: number | string | null
  partnerNote: string | null
  createdAt: string
  updatedAt: string
  medicationName: string
  /** Source of this record: Healthie appointment, form completion, or legacy DB order */
  sourceType?: 'appointment' | 'form_completion' | 'legacy_order'
  /** Human-readable name (appointment type, medication, or form name) */
  displayName?: string
  /** Appointment-specific fields */
  appointmentDate?: string | null
  appointmentTime?: string | null
  contactType?: string | null
  providerName?: string | null
}

// ===========================================
// STATUS MAPPING
// ===========================================

const STATUS_MAP: Partial<Record<string, OrderStatusDisplay>> = {
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
  Incomplete: {
    label: 'Incomplete',
    explanation: 'Additional information is needed to process your order.',
    color: 'amber',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
  },
  'Approval Needed': {
    label: 'Approval Needed',
    explanation: 'Your order is awaiting provider approval.',
    color: 'amber',
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-800',
  },
  Submitted: {
    label: 'Submitted',
    explanation: 'Your order has been submitted and is under review.',
    color: 'amber',
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-800',
  },
  'RX Submitted': {
    label: 'Prescription Submitted',
    explanation: 'Your prescription has been submitted to the pharmacy.',
    color: 'blue',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-700',
  },
  'RX Approved': {
    label: 'Prescription Approved',
    explanation: 'Your prescription has been approved by the pharmacy.',
    color: 'green',
    bgClass: 'bg-green-50',
    textClass: 'text-green-700',
  },
  Shipped: {
    label: 'Shipped',
    explanation: 'Your order is on its way.',
    color: 'blue',
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-800',
  },
  Delivered: {
    label: 'Delivered',
    explanation: 'Your order has been delivered.',
    color: 'green',
    bgClass: 'bg-green-100',
    textClass: 'text-green-800',
  },
  'Payment Pending': {
    label: 'Payment Pending',
    explanation: 'Payment is required to proceed with your order.',
    color: 'amber',
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-800',
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
  // Healthie appointment statuses
  Scheduled: {
    label: 'Scheduled',
    explanation: 'Your appointment is confirmed.',
    color: 'blue',
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-800',
  },
  Occurred: {
    label: 'Completed',
    explanation: 'Your appointment has been completed.',
    color: 'green',
    bgClass: 'bg-green-100',
    textClass: 'text-green-800',
  },
  Cancelled: {
    label: 'Cancelled',
    explanation: 'This appointment was cancelled.',
    color: 'gray',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-600',
  },
  'No-Show': {
    label: 'Missed',
    explanation: 'This appointment was missed.',
    color: 'red',
    bgClass: 'bg-red-100',
    textClass: 'text-red-800',
  },
  'Re-Scheduled': {
    label: 'Rescheduled',
    explanation: 'This appointment has been rescheduled.',
    color: 'amber',
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-800',
  },
}

/**
 * Get the display properties for a given order status.
 * Returns label, explanation, color, and Tailwind CSS classes.
 * Falls back to PENDING display for unknown statuses.
 */
export function getStatusDisplay(status: OrderStatus): OrderStatusDisplay {
  return STATUS_MAP[status] ?? STATUS_MAP['PENDING']!
}

// ===========================================
// ACTIVE STATUS HELPERS
// ===========================================

/**
 * Statuses considered "active" — used to identify the hero card order.
 * In-flight pipeline statuses are active; COMPLETED, DENIED, and CANCELLED are terminal.
 */
export const ACTIVE_STATUSES: OrderStatus[] = [
  'PENDING',
  'APPROVED',
  'WaitingRoom',
  'Incomplete',
  'Approval Needed',
  'Submitted',
  'RX Submitted',
  'RX Approved',
  'Shipped',
  'Payment Pending',
  'Scheduled',
  'Re-Scheduled',
]

/**
 * Check if a given order status is active (non-terminal).
 */
export function isActiveStatus(status: OrderStatus): boolean {
  return ACTIVE_STATUSES.includes(status)
}
