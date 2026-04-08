'use client'

import { MemberDashboard } from '@/components/library/MemberDashboard'
import type { LibraryAccess, PlanTier } from '@/lib/config/plans'

export function LibraryContent({
  email,
  tier,
  libraryAccess,
}: {
  email: string
  tier: PlanTier | null
  libraryAccess: LibraryAccess
}) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <MemberDashboard
        tier={tier}
        libraryAccess={libraryAccess}
        email={email}
      />
    </div>
  )
}
