'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: 'Network', href: '/admin/creators' },
  { label: 'Performance', href: '/admin/creators/coupons' },
  { label: 'Approvals', href: '/admin/creators/approvals' },
  { label: 'Payouts', href: '/admin/creators/payouts' },
]

export default function CreatorsHubLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isTabActive = (href: string) => {
    if (href === '/admin/creators') {
      return pathname === '/admin/creators'
    }
    return pathname === href || pathname?.startsWith(href + '/')
  }

  return (
    <div>
      <div className="bg-stone-50 border-b border-brand-primary/10 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <nav className="flex gap-1 overflow-x-auto" aria-label="Creators hub sections">
            {TABS.map((tab) => {
              const active = isTabActive(tab.href)
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    active
                      ? 'border-cultr-forest text-cultr-forest'
                      : 'border-transparent text-cultr-textMuted hover:text-cultr-forest hover:border-brand-primary/30'
                  }`}
                >
                  {tab.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
      {children}
    </div>
  )
}
