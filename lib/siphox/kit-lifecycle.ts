// Kit Lifecycle State Derivation
// Maps internal DB status + fulfillment_status to 7 user-facing timeline states.
// All UI code references lifecycle state, never raw DB status.

import type { SiphoxKitOrderRow } from './db'

// ============================================================
// TYPES
// ============================================================

export type KitLifecycleState =
  | 'no_kit'
  | 'ordered'
  | 'shipped'
  | 'registered'
  | 'sample_mailed'
  | 'processing'
  | 'results_ready'

export interface KitLifecycleStage {
  key: KitLifecycleState
  label: string
  description: string
  estimatedTime?: string
}

// ============================================================
// LIFECYCLE STAGES (ordered progression)
// ============================================================

export const KIT_LIFECYCLE_STAGES: readonly KitLifecycleStage[] = [
  {
    key: 'no_kit',
    label: 'No Kit',
    description: "You don't have a blood test kit yet",
  },
  {
    key: 'ordered',
    label: 'Ordered',
    description: 'Your kit is being prepared',
    estimatedTime: '1-2 business days',
  },
  {
    key: 'shipped',
    label: 'Shipped',
    description: 'Your kit is on its way',
    estimatedTime: '3-5 business days',
  },
  {
    key: 'registered',
    label: 'Registered',
    description: 'Kit registered successfully',
  },
  {
    key: 'sample_mailed',
    label: 'Sample Mailed',
    description: 'Your sample is in transit to the lab',
    estimatedTime: '2-3 business days',
  },
  {
    key: 'processing',
    label: 'Processing',
    description: 'Lab is analyzing your sample',
    estimatedTime: '5-7 business days',
  },
  {
    key: 'results_ready',
    label: 'Results Ready',
    description: 'Your biomarker results are available',
  },
] as const

// ============================================================
// STATE DERIVATION
// ============================================================

/**
 * Derive the user-facing lifecycle state from a kit order's DB columns.
 *
 * Priority: check `status` field first for advanced states (results_ready,
 * processing, sample_mailed, registered), then derive from fulfillment_status
 * + tracking_number for earlier states.
 */
export function deriveKitLifecycleState(order: SiphoxKitOrderRow): KitLifecycleState {
  // Advanced states from the status column (set by SiPhox or manual updates)
  if (order.status === 'results_ready') return 'results_ready'
  if (order.status === 'processing') return 'processing'
  if (order.status === 'sample_mailed') return 'sample_mailed'
  if (order.status === 'registered') return 'registered'

  // Early states derived from fulfillment_status + tracking_number
  if (['pending_intake', 'pending_fulfillment', 'needs_credits'].includes(order.fulfillment_status)) {
    return 'ordered'
  }

  // Fulfilled with tracking = shipped
  if (order.fulfillment_status === 'fulfilled' && order.tracking_number) {
    return 'shipped'
  }

  // Fulfilled but no tracking yet (SiPhox confirmed but hasn't shipped)
  if (order.fulfillment_status === 'fulfilled') {
    return 'ordered'
  }

  // Default fallback
  return 'ordered'
}
