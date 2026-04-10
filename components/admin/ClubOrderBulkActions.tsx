'use client'

import { PIPELINE_LABELS } from '@/lib/admin-club-orders'

interface ClubOrderBulkActionsProps {
  selectedCount: number
  isBulkUpdating: boolean
  onBulkMove: (targetStatus: string) => void
  onClearSelection: () => void
}

export default function ClubOrderBulkActions({
  selectedCount,
  isBulkUpdating,
  onBulkMove,
  onClearSelection,
}: ClubOrderBulkActionsProps) {
  if (selectedCount === 0) return null

  return (
    <div className="flex items-center gap-3 mb-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
      <span className="text-sm font-medium text-amber-800">{selectedCount} selected</span>
      <select
        disabled={isBulkUpdating}
        defaultValue=""
        onChange={(e) => {
          const target = e.target.value
          if (!target) return
          if (confirm(`Mark ${selectedCount} manually processed order(s) as "${PIPELINE_LABELS[target] || target}"?\n\nThis will not create QuickBooks invoices or send status emails.`)) {
            onBulkMove(target)
          }
          e.target.value = ''
        }}
        className="px-3 py-1.5 text-sm rounded-lg border border-amber-300 bg-white text-amber-900 cursor-pointer disabled:opacity-50"
      >
        <option value="">Mark manually processed as…</option>
        <option value="approved">{PIPELINE_LABELS.approved}</option>
        <option value="paid">{PIPELINE_LABELS.paid}</option>
        <option value="fulfilled">{PIPELINE_LABELS.fulfilled}</option>
        <option value="cancelled">{PIPELINE_LABELS.cancelled}</option>
      </select>
      <button
        onClick={onClearSelection}
        className="text-sm text-amber-600 hover:text-amber-800 ml-auto font-medium"
      >
        Clear
      </button>
      {isBulkUpdating && <span className="text-xs text-amber-600 animate-pulse font-medium">Updating...</span>}
    </div>
  )
}
