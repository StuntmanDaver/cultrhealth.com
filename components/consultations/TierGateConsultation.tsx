'use client'

import Link from 'next/link'

interface TierGateConsultationProps {
  used: number
  limit: number | 'unlimited'
  tier: string
}

export function TierGateConsultation({ used, limit, tier }: TierGateConsultationProps) {
  const isUnlimited = limit === 'unlimited'
  const remaining = isUnlimited ? null : (limit as number) - used
  const isExhausted = !isUnlimited && remaining !== null && remaining <= 0
  const isClub = tier === 'club'

  if (isClub || (isExhausted && !isUnlimited)) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm font-medium text-amber-800 mb-1">
          {isClub ? 'Consultations not included in Club tier' : 'Monthly consultation limit reached'}
        </p>
        <p className="text-xs text-amber-700 mb-3">
          {isClub
            ? 'Upgrade to Core, Catalyst+, or Concierge to book video consultations with our providers.'
            : `You have used all ${limit} consultation${(limit as number) > 1 ? 's' : ''} for this month. Upgrade to increase your limit.`}
        </p>
        <Link
          href="/pricing"
          className="inline-flex px-4 py-1.5 bg-amber-800 text-white rounded-full text-xs font-medium hover:bg-amber-900 transition-colors"
        >
          Upgrade Plan
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-mint/40 border border-sage/40 rounded-xl p-4">
      <p className="text-sm text-brand-primary">
        {isUnlimited
          ? 'Unlimited consultations included in your plan.'
          : `${remaining} of ${limit} consultation${(limit as number) > 1 ? 's' : ''} remaining this month.`}
      </p>
    </div>
  )
}
