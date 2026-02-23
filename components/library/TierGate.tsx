'use client'

import Link from 'next/link'
import Button from '@/components/ui/Button'
import type { PlanTier } from '@/lib/config/plans'
import type { ReactNode } from 'react'

const TIER_ORDER: PlanTier[] = ['club', 'core', 'catalyst', 'concierge']

function getTierRank(tier: PlanTier | null | undefined): number {
  const normalized = tier ?? 'club'
  const rank = TIER_ORDER.indexOf(normalized)
  return rank === -1 ? 0 : rank
}

interface TierGateProps {
  requiredTier: PlanTier
  currentTier: PlanTier | null | undefined
  upgradeMessage: string | ReactNode
  children: ReactNode
}

export function TierGate({ requiredTier, currentTier, upgradeMessage, children }: TierGateProps) {
  const hasAccess = getTierRank(currentTier) >= getTierRank(requiredTier)

  if (hasAccess) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-60 blur-[1px]">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-2xl border border-cultr-sage bg-white/95 px-4 py-3 text-center shadow-lg">
          <p className="text-sm font-medium text-cultr-text">{upgradeMessage}</p>
          <Link href="/pricing" className="mt-2 inline-flex">
            <Button size="sm">Upgrade</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
