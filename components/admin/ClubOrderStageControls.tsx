'use client'

import { useState } from 'react'
import { Loader2, Check, DollarSign, Truck, CheckCircle2, AlertTriangle, CreditCard } from 'lucide-react'
import {
  PIPELINE_STATUSES,
  PIPELINE_LABELS,
  TERMINAL_STATUSES,
  getMoveTargets,
  getMoveNote
} from '@/lib/admin-club-orders'

interface ShipmentExtra {
  carrier?: string
  trackingNumber?: string
  trackingUrl?: string
  suppressEmails?: boolean
  manualProcessed?: boolean
}

interface ClubOrderStageControlsProps {
  orderId: string
  currentStatus: string
  isApproving: boolean
  isUpdating: boolean
  onApprove: (orderId: string) => void
  onStatusUpdate: (
    orderId: string,
    newStatus: string,
    extra?: ShipmentExtra
  ) => void
}

export default function ClubOrderStageControls({
  orderId,
  currentStatus,
  isApproving,
  isUpdating,
  onApprove,
  onStatusUpdate,
}: ClubOrderStageControlsProps) {
  const currentIdx = PIPELINE_STATUSES.indexOf(currentStatus)
  const nextStatus = currentIdx >= 0 && currentIdx < PIPELINE_STATUSES.length - 1 ? PIPELINE_STATUSES[currentIdx + 1] : null
  const moveTargets = getMoveTargets(currentStatus)

  // Statuses that fire a customer-facing email (see route.ts sendCustomerStatusEmail)
  const EMAIL_TRIGGER_LABELS: Record<string, string> = {
    paid: 'Payment Confirmed',
    shipped: 'Your Order Has Shipped',
    fulfilled: 'Order Complete',
  }
  const nextStatusTriggersEmail = nextStatus !== null && nextStatus in EMAIL_TRIGGER_LABELS
  const isTerminal = TERMINAL_STATUSES.includes(currentStatus)
  const manualProcessingOptions = [
    { value: 'approved', label: 'Approved (No QB / No Email)' },
    { value: 'needs_payment', label: 'Needs Payment (No Email)' },
    { value: 'paid', label: 'Paid (No Email)' },
    { value: 'shipped', label: 'Shipped (No Email)' },
    { value: 'fulfilled', label: 'Fulfilled (No Email)' },
    { value: 'cancelled', label: 'Cancelled' },
  ] as const

  // ── Inline shipping form state ──
  const [pendingShipment, setPendingShipment] = useState<{ suppressEmails: boolean; manualProcessed: boolean } | null>(null)
  const [shipCarrier, setShipCarrier] = useState('')
  const [shipTrackingNumber, setShipTrackingNumber] = useState('')
  const [shipTrackingUrl, setShipTrackingUrl] = useState('')

  function openShippingForm(opts: { suppressEmails: boolean; manualProcessed: boolean }) {
    setPendingShipment(opts)
    setShipCarrier('')
    setShipTrackingNumber('')
    setShipTrackingUrl('')
  }

  function handleConfirmShipment(e: React.MouseEvent) {
    e.stopPropagation()
    if (!pendingShipment) return
    const extra: ShipmentExtra = {
      carrier: shipCarrier || undefined,
      trackingNumber: shipTrackingNumber || undefined,
      trackingUrl: shipTrackingUrl || undefined,
    }
    if (pendingShipment.suppressEmails) extra.suppressEmails = true
    if (pendingShipment.manualProcessed) extra.manualProcessed = true
    onStatusUpdate(orderId, 'shipped', extra)
    setPendingShipment(null)
  }

  function handlePendingManualProcessed(target: string) {
    // Shipped requires tracking info — open the inline form instead of a confirm dialog
    if (target === 'shipped') {
      openShippingForm({ suppressEmails: true, manualProcessed: true })
      return
    }
    const targetLabel = PIPELINE_LABELS[target] || target
    const note = target === 'cancelled'
      ? 'This will cancel the order without creating a QuickBooks invoice or sending status emails.'
      : `This will mark the order as "${targetLabel}" without creating a QuickBooks invoice or sending status emails.`

    if (!confirm(`Mark this order as manually processed and move it to "${targetLabel}"?\n\n${note}`)) {
      return
    }

    onStatusUpdate(orderId, target, { suppressEmails: true, manualProcessed: true })
  }

  // ── Inline shipping form (shown when a shipped transition is pending) ──
  if (pendingShipment !== null) {
    return (
      <div className="flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
            <Truck className="w-4 h-4" /> Enter shipment details
          </p>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Carrier (e.g. UPS, FedEx)"
              value={shipCarrier}
              onChange={(e) => setShipCarrier(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-2 text-sm rounded-lg border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <input
              type="text"
              placeholder="Tracking number"
              value={shipTrackingNumber}
              onChange={(e) => setShipTrackingNumber(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-2 text-sm rounded-lg border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <input
              type="text"
              placeholder="Tracking URL (optional)"
              value={shipTrackingUrl}
              onChange={(e) => setShipTrackingUrl(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-2 text-sm rounded-lg border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleConfirmShipment}
              disabled={isUpdating}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
              {isUpdating ? 'Shipping...' : 'Confirm Shipment'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setPendingShipment(null) }}
              disabled={isUpdating}
              className="px-3 py-2 text-sm rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Email send warning — shown whenever the primary next step fires a customer email */}
      {nextStatusTriggersEmail && currentStatus !== 'pending_approval' && nextStatus !== 'shipped' && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">Sends customer email.</span> Moving to{' '}
            <span className="font-medium">{PIPELINE_LABELS[nextStatus!] || nextStatus}</span> will send the customer a{' '}
            &ldquo;{EMAIL_TRIGGER_LABELS[nextStatus!]}&rdquo; notification. If this was already processed manually, use{' '}
            <span className="font-medium">Skip (No Email)</span> to sync without notifying them again.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {/* Primary action: Approve for pending, next step for others */}
        {currentStatus === 'pending_approval' && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onApprove(orderId) }}
              disabled={isApproving || isUpdating}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isApproving ? 'Approving...' : 'Approve & Send Invoice'}
            </button>
            <select
              aria-label="Mark manually processed"
              defaultValue=""
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation()
                const target = e.target.value
                if (!target) return
                handlePendingManualProcessed(target)
                e.target.value = ''
              }}
              disabled={isApproving || isUpdating}
              className="px-3 py-2 text-sm rounded-lg border border-brand-primary/20 bg-brand-primary/5 text-brand-primary cursor-pointer disabled:opacity-50 transition-colors hover:bg-brand-primary/10 font-medium"
            >
              <option value="">Mark manually processed as…</option>
              {manualProcessingOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </>
        )}

        {/* Dynamic Next Step Button */}
        {nextStatus && currentStatus !== 'pending_approval' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Shipped always opens the inline tracking form instead of a direct status call
              if (nextStatus === 'shipped') {
                openShippingForm({ suppressEmails: false, manualProcessed: false })
                return
              }
              if (nextStatusTriggersEmail) {
                const emailLabel = EMAIL_TRIGGER_LABELS[nextStatus]
                const ok = confirm(
                  `This will send a "${emailLabel}" email to the customer.\n\n` +
                  `If this order was already processed manually outside the dashboard, the customer will receive a duplicate notification.\n\n` +
                  `Use "Skip ${PIPELINE_LABELS[nextStatus] || nextStatus} (No Email)" instead if you're syncing records.`
                )
                if (!ok) return
              }
              onStatusUpdate(orderId, nextStatus)
            }}
            disabled={isUpdating || isApproving}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50 transition-colors ${
              nextStatus === 'needs_payment' ? 'bg-orange-500 hover:bg-orange-600'
                : nextStatus === 'paid' ? 'bg-green-600 hover:bg-green-700'
                  : nextStatus === 'shipped' ? 'bg-blue-600 hover:bg-blue-700'
                    : nextStatus === 'fulfilled' ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-brand-primary hover:bg-brand-primaryHover'
            }`}
          >
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              nextStatus === 'needs_payment' ? <CreditCard className="w-4 h-4" /> :
                nextStatus === 'paid' ? <DollarSign className="w-4 h-4" /> :
                  nextStatus === 'shipped' ? <Truck className="w-4 h-4" /> :
                    nextStatus === 'fulfilled' ? <CheckCircle2 className="w-4 h-4" /> : null
            )}
            {isUpdating ? 'Updating...' : `Mark ${PIPELINE_LABELS[nextStatus] || nextStatus}`}
          </button>
        )}

        {/* Skip (No Email) button */}
        {nextStatus && currentStatus !== 'pending_approval' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Shipped requires tracking — open inline form even when skipping email
              if (nextStatus === 'shipped') {
                openShippingForm({ suppressEmails: true, manualProcessed: false })
                return
              }
              if (confirm(`Skip email trigger and move to "${PIPELINE_LABELS[nextStatus] || nextStatus}"?`)) {
                onStatusUpdate(orderId, nextStatus, { suppressEmails: true })
              }
            }}
            disabled={isUpdating || isApproving}
            className="px-4 py-2 text-sm rounded-lg border border-brand-primary/20 bg-brand-primary/5 text-brand-primary hover:bg-brand-primary/10 disabled:opacity-50 transition-colors font-medium"
          >
            {`Skip ${PIPELINE_LABELS[nextStatus] || nextStatus} (No Email)`}
          </button>
        )}

        {/* Move to — forward skip OR backward rollback */}
        {currentStatus !== 'pending_approval' && moveTargets.length > 0 && (
          <select
            disabled={isUpdating || isApproving}
            defaultValue=""
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation()
              const target = e.target.value
              if (!target) return
              e.target.value = ''
              // Shipped always requires tracking info regardless of direction
              if (target === 'shipped') {
                openShippingForm({ suppressEmails: true, manualProcessed: false })
                return
              }
              const note = getMoveNote(currentStatus, target)
              if (confirm(`Move to "${PIPELINE_LABELS[target] || target}"?\n\n${note}`)) {
                onStatusUpdate(orderId, target, { suppressEmails: true })
              }
            }}
            className="px-3 py-2 text-sm rounded-lg border border-brand-primary/20 bg-brand-primary/5 text-brand-primary cursor-pointer disabled:opacity-50 transition-colors hover:bg-brand-primary/10"
          >
            <option value="">Skip to… (No Email)</option>
            {moveTargets.map(s => {
              const targetIdx = PIPELINE_STATUSES.indexOf(s)
              const isBack = currentIdx >= 0 && targetIdx >= 0 && targetIdx < currentIdx
              return <option key={s} value={s}>{isBack ? '← ' : ''}{PIPELINE_LABELS[s] || s}</option>
            })}
            {!isTerminal && <option value="cancelled">Cancel</option>}
          </select>
        )}

        {/* Cancel Action */}
        {!isTerminal && currentStatus !== 'pending_approval' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (confirm('Cancel this order?')) onStatusUpdate(orderId, 'cancelled')
            }}
            disabled={isUpdating || isApproving}
            className="px-4 py-2 text-sm rounded-lg border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors font-medium"
          >
            Cancel Order
          </button>
        )}
      </div>
    </div>
  )
}
