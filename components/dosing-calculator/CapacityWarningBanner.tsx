'use client'

import { AlertTriangle } from 'lucide-react'
import type { CapacityStatus } from '@/lib/peptide-calculator'

type Props = {
  capacityStatus: CapacityStatus
  drawMl: number
  syringeMl: number
  recommendedSyringeMl: number | null
  capacityPct: number
}

export function CapacityWarningBanner({
  capacityStatus,
  drawMl,
  syringeMl,
  recommendedSyringeMl,
  capacityPct,
}: Props) {
  if (capacityStatus === 'exceeds') {
    const drawFmt = drawMl.toFixed(2)
    const tail =
      recommendedSyringeMl != null
        ? `Use a ${recommendedSyringeMl} mL syringe or adjust concentration.`
        : 'Reduce dose, add more diluent, or split across multiple injections.'
    // role="status" + aria-live="polite" rather than role="alert": a calculator
    // is a frequently-edited surface, and an assertive alert every keystroke
    // would be hostile. Screen readers announce status updates when the user
    // pauses input, which is the right rhythm here.
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl border-2 border-red-400 bg-red-50 p-5 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-display text-sm font-bold uppercase tracking-wider text-red-700">
              Exceeds syringe capacity
            </p>
            <p className="text-sm leading-relaxed text-red-800">
              This dose requires <strong>{drawFmt} mL</strong>; selected syringe capacity is{' '}
              <strong>{syringeMl} mL</strong>. {tail}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (capacityStatus === 'near') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-amber-300 bg-amber-50 p-4"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-amber-800">
            You&apos;re using <strong>{Math.round(capacityPct)}%</strong> of the selected{' '}
            {syringeMl} mL syringe — close to the limit. Double-check your draw before dosing.
          </p>
        </div>
      </div>
    )
  }

  return null
}
