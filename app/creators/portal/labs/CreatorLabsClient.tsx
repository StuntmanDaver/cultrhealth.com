'use client'

import Link from 'next/link'
import { TestTube2 } from 'lucide-react'

export default function CreatorLabsClient() {
  return (
    <div className="mx-auto max-w-2xl p-6 md:p-8">
      <div className="rounded-2xl border border-brand-primary/10 bg-cream-dark p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sage/30">
          <TestTube2 className="h-7 w-7 text-brand-primary" />
        </div>
        <h1 className="mb-2 font-display text-2xl font-bold text-brand-primary">Creator Labs</h1>
        <p className="mx-auto mb-6 max-w-md text-sm text-brand-primary/70">
          Labs data is temporarily unavailable while this section is being updated.
        </p>
        <Link
          href="/creators/portal/support"
          className="inline-flex items-center rounded-full bg-brand-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-forest-light"
        >
          Contact Support
        </Link>
      </div>
    </div>
  )
}
