'use client'

import { useState } from 'react'
import { Loader2, Check, DollarSign, Truck, CheckCircle2 } from 'lucide-react'
import {
  PIPELINE_ORDER,
  PIPELINE_STATUSES,
  PIPELINE_LABELS,
  TERMINAL_STATUSES,
  getMoveTargets,
  getMoveNote
} from '@/lib/admin-club-orders'

interface ClubOrderStageControlsProps {
  orderId: string
  currentStatus: string
  isApproving: boolean
  isUpdating: boolean
  onApprove: (orderId: string) => void
  onStatusUpdate: (
    orderId: string,
    newStatus: string,
    extra?: { carrier?: string; trackingNumber?: string; trackingUrl?: string; suppressEmails?: boolean }
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
  const [isShippingThis, setIsShippingThis] = useState(false)
  const [shippingForm, setShippingForm] = useState({ carrier: '', trackingNumber: '', trackingUrl: '' })

  const currentIdx = PIPELINE_STATUSES.indexOf(currentStatus)
  const nextStatus = currentIdx >= 0 && currentIdx < PIPELINE_STATUSES.length - 1 ? PIPELINE_STATUSES[currentIdx + 1] : null
  const moveTargets = getMoveTargets(currentStatus)
  const isTerminal = TERMINAL_STATUSES.includes(currentStatus)

  return (
    <div className="flex flex-col gap-3">
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
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('Skip invoice/email and move this order to "Approved"?')) {
                  onStatusUpdate(orderId, 'approved', { suppressEmails: true })
                }
              }}
              disabled={isApproving || isUpdating}
              className="px-4 py-2 text-sm rounded-lg border border-brand-primary/20 bg-brand-primary/5 text-brand-primary hover:bg-brand-primary/10 disabled:opacity-50 transition-colors font-medium"
            >
              Skip to Approved (No Email)
            </button>
          </>
        )}

        {/* Dynamic Next Step Button */}
        {nextStatus && currentStatus !== 'pending_approval' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (nextStatus === 'shipped') {
                setIsShippingThis(true)
              } else {
                onStatusUpdate(orderId, nextStatus)
              }
            }}
            disabled={isUpdating || isApproving || isShippingThis}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50 transition-colors ${
              nextStatus === 'paid' ? 'bg-green-600 hover:bg-green-700'
                : nextStatus === 'shipped' ? 'bg-blue-600 hover:bg-blue-700'
                  : nextStatus === 'fulfilled' ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-brand-primary hover:bg-brand-primaryHover'
            }`}
          >
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              nextStatus === 'paid' ? <DollarSign className="w-4 h-4" /> :
                nextStatus === 'shipped' ? <Truck className="w-4 h-4" /> :
                  nextStatus === 'fulfilled' ? <CheckCircle2 className="w-4 h-4" /> : null
            )}
            {isUpdating ? 'Updating...' : `Mark ${PIPELINE_LABELS[nextStatus] || nextStatus}`}
          </button>
        )}
        {nextStatus && currentStatus !== 'pending_approval' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (confirm(`Skip email trigger and move to "${PIPELINE_LABELS[nextStatus] || nextStatus}"?`)) {
                onStatusUpdate(orderId, nextStatus, { suppressEmails: true })
              }
            }}
            disabled={isUpdating || isApproving || isShippingThis}
            className="px-4 py-2 text-sm rounded-lg border border-brand-primary/20 bg-brand-primary/5 text-brand-primary hover:bg-brand-primary/10 disabled:opacity-50 transition-colors font-medium"
          >
            {`Skip ${PIPELINE_LABELS[nextStatus] || nextStatus} (No Email)`}
          </button>
        )}

        {/* Move to — forward skip OR backward rollback */}
        {moveTargets.length > 0 && (
          <select
            disabled={isUpdating || isApproving}
            value=""
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation()
              const target = e.target.value
              if (!target) return
              const note = getMoveNote(currentStatus, target)
              if (confirm(`Move to "${PIPELINE_LABELS[target] || target}"?\n\n${note}`)) {
                onStatusUpdate(orderId, target, { suppressEmails: true })
              }
              e.target.value = ''
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
        {!isTerminal && (
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

      {/* Inline Shipping Form */}
      {isShippingThis && (
        <div className="mt-2 bg-blue-50 rounded-lg p-4 space-y-2 border border-blue-100">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Shipping Details</h4>
          <input
            type="text"
            placeholder="Carrier (e.g., USPS, UPS, FedEx)"
            value={shippingForm.carrier}
            onChange={(e) => setShippingForm(f => ({ ...f, carrier: e.target.value }))}
            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white"
            onClick={(e) => e.stopPropagation()}
          />
          <input
            type="text"
            placeholder="Tracking Number"
            value={shippingForm.trackingNumber}
            onChange={(e) => setShippingForm(f => ({ ...f, trackingNumber: e.target.value }))}
            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white"
            onClick={(e) => e.stopPropagation()}
          />
          <input
            type="text"
            placeholder="Tracking URL (optional)"
            value={shippingForm.trackingUrl}
            onChange={(e) => setShippingForm(f => ({ ...f, trackingUrl: e.target.value }))}
            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex gap-2 pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onStatusUpdate(orderId, 'shipped', {
                  carrier: shippingForm.carrier,
                  trackingNumber: shippingForm.trackingNumber,
                  trackingUrl: shippingForm.trackingUrl || undefined,
                })
                // Form stays open while updating, reset via props updating but can reset locally if needed
                setIsShippingThis(false)
                setShippingForm({ carrier: '', trackingNumber: '', trackingUrl: '' })
              }}
              disabled={isUpdating || !shippingForm.carrier || !shippingForm.trackingNumber}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
              {isUpdating ? 'Shipping...' : 'Confirm Shipment'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsShippingThis(false)
                setShippingForm({ carrier: '', trackingNumber: '', trackingUrl: '' })
              }}
              className="px-4 py-2 border border-blue-200 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
