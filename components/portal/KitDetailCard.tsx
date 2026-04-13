'use client'

import type { KitLifecycleState } from '@/lib/siphox/kit-lifecycle'

interface KitDetailCardProps {
  currentState: KitLifecycleState
  trackingNumber?: string | null
}

interface StageInfo {
  message: string
  nextSteps: string
  cta?: string
}

const STAGE_INFO: Record<string, StageInfo> = {
  ordered: {
    message: 'Your kit is being prepared and will ship soon.',
    nextSteps: 'Expect shipping confirmation within 1-2 business days.',
  },
  shipped: {
    message: 'Your kit has been shipped!',
    nextSteps:
      'Look for it in 3-5 business days. Once it arrives, register it here.',
  },
  registered: {
    message:
      "Your kit is registered! Now it's time to collect your sample.",
    nextSteps:
      'Follow the instructions in your kit, then mail your sample back using the prepaid envelope.',
  },
  sample_mailed: {
    message: 'Your sample is on its way to the lab.',
    nextSteps:
      'The lab will receive and begin processing within 2-3 business days.',
  },
  processing: {
    message: 'The lab is analyzing your sample.',
    nextSteps:
      "Results typically take 5-7 business days. We'll notify you when they're ready.",
  },
  results_ready: {
    message: 'Your biomarker results are ready!',
    nextSteps: 'Results dashboard coming soon.',
  },
}

export function KitDetailCard({ currentState, trackingNumber }: KitDetailCardProps) {
  const info = STAGE_INFO[currentState]
  if (!info) return null

  return (
    <div className="rounded-2xl border border-brand-primary/10 bg-white p-6 mt-6">
      <p className="text-sm font-semibold text-brand-primary mb-1">
        {info.message}
      </p>
      {currentState === 'shipped' && trackingNumber && (
        <p className="text-sm text-brand-primary/70 mt-1">
          Tracking: {trackingNumber}
        </p>
      )}
      <p className="text-sm text-brand-primary/50 mt-3">{info.nextSteps}</p>
    </div>
  )
}
