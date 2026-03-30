'use client'

import Link from 'next/link'
import { TestTube2 } from 'lucide-react'
import Button from '@/components/ui/Button'

interface KitEmptyStateProps {
  tier: string | null
  hasKitOrder: boolean
}

export function KitEmptyState({ tier, hasKitOrder }: KitEmptyStateProps) {
  // Club tier or no tier -- upgrade CTA
  if (tier === 'club' || tier === null) {
    return (
      <div className="rounded-2xl border border-brand-primary/10 bg-white p-8 text-center max-w-md mx-auto">
        <TestTube2 className="w-12 h-12 text-brand-primary/30 mx-auto mb-4" />
        <h2 className="text-xl font-display font-semibold text-brand-primary mb-2">
          Blood Testing Available on Paid Plans
        </h2>
        <p className="text-sm text-brand-primary/60 mb-6">
          Blood testing is available on Core ($149/mo) and above. Upgrade to get
          comprehensive biomarker analysis.
        </p>
        <Link href="/pricing">
          <Button variant="primary">View Plans</Button>
        </Link>
      </div>
    )
  }

  // Core tier without add-on
  if (tier === 'core' && !hasKitOrder) {
    return (
      <div className="rounded-2xl border border-brand-primary/10 bg-white p-8 text-center max-w-md mx-auto">
        <TestTube2 className="w-12 h-12 text-brand-primary/30 mx-auto mb-4" />
        <h2 className="text-xl font-display font-semibold text-brand-primary mb-2">
          Add Blood Testing to Your Plan
        </h2>
        <p className="text-sm text-brand-primary/60 mb-6">
          Add a blood test kit to your plan for $135. Get 33 biomarkers (upgradable to 59+) analyzed
          from the comfort of your home.
        </p>
        <Link href="/join/core">
          <Button variant="primary">Add Blood Test Kit</Button>
        </Link>
      </div>
    )
  }

  // Fallback -- eligible but no order yet
  return (
    <div className="rounded-2xl border border-brand-primary/10 bg-white p-8 text-center max-w-md mx-auto">
      <TestTube2 className="w-12 h-12 text-brand-primary/30 mx-auto mb-4" />
      <h2 className="text-xl font-display font-semibold text-brand-primary mb-2">
        No Kit Order Found
      </h2>
      <p className="text-sm text-brand-primary/60 mb-6">
        It looks like you don&apos;t have a kit order yet. Check your subscription
        tier or contact support for help.
      </p>
      <a href="mailto:support@cultrhealth.com">
        <Button variant="secondary">Contact Support</Button>
      </a>
    </div>
  )
}
