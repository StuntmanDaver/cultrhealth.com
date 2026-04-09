// Shared club-order pipeline metadata and helpers
// Safe to import from both API routes and client components.

export const PIPELINE_ORDER = ['pending_approval', 'approved', 'invoice_sent', 'paid', 'shipped', 'fulfilled'] as const;
export type ClubOrderStage = typeof PIPELINE_ORDER[number];

export const PIPELINE_STATUSES = ['pending_approval', 'approved', 'invoice_sent', 'paid', 'shipped', 'fulfilled'];
export const ALL_PIPELINE_AND_CANCEL = [...PIPELINE_STATUSES, 'cancelled'];

export const PIPELINE_LABELS: Record<string, string> = {
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  invoice_sent: 'Invoice Sent',
  paid: 'Paid',
  shipped: 'Shipped',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
  dismissed: 'Dismissed',
};

// Next action after each status for UI and admin email buttons
export const NEXT_ACTIONS: Record<string, { status: string; label: string; color: string }> = {
  approved: { status: 'paid', label: 'Mark Paid', color: '#16a34a' },
  invoice_sent: { status: 'paid', label: 'Mark Paid', color: '#16a34a' },
  shipped: { status: 'fulfilled', label: 'Mark Fulfilled', color: '#059669' },
};

export const ALLOWED_TRANSITIONS: Record<string, string[]> = Object.fromEntries(
  ALL_PIPELINE_AND_CANCEL.map(status => [
    status,
    ALL_PIPELINE_AND_CANCEL.filter(s => s !== status), // can go to any other status
  ])
);

export const TERMINAL_STATUSES = ['cancelled', 'fulfilled', 'rejected', 'dismissed'];

export function getMoveTargets(currentStatus: string): string[] {
  const currentIdx = PIPELINE_STATUSES.indexOf(currentStatus);
  const targets = currentIdx >= 0
    ? PIPELINE_STATUSES.filter((_, i) => i !== currentIdx)
    : currentStatus === 'cancelled' ? PIPELINE_STATUSES : []; // cancelled can reopen to any stage
  return targets;
}

export function getMoveNote(currentStatus: string, targetStatus: string): string {
  const currentIdx = PIPELINE_STATUSES.indexOf(currentStatus);
  const targetIdx = PIPELINE_STATUSES.indexOf(targetStatus);
  const goingBack = currentIdx >= 0 && targetIdx >= 0 && targetIdx < currentIdx;

  if (goingBack) {
    return `Rolling back to "${PIPELINE_LABELS[targetStatus] || targetStatus}". Timestamps for later stages will be cleared.`;
  }
  if (currentStatus === 'pending_approval') {
    return `This will NOT create a QuickBooks invoice or send approval emails.\nUse this when the order was already handled manually.`;
  }
  return `All skipped stage timestamps will be set automatically. No status emails will be sent.`;
}
