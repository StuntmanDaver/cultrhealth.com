'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Share2,
  DollarSign,
  Users,
  Wallet,
  BookOpen,
  LifeBuoy,
  Settings,
  X,
  Megaphone,
} from 'lucide-react'

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { label: 'Dashboard', href: '/creators/portal/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'PROMOTE',
    items: [
      { label: 'Share & Earn', href: '/creators/portal/share', icon: Share2 },
      { label: 'Campaigns', href: '/creators/portal/campaigns', icon: Megaphone },
    ],
  },
  {
    label: 'MONEY',
    items: [
      { label: 'Earnings', href: '/creators/portal/earnings', icon: DollarSign },
      { label: 'Payouts', href: '/creators/portal/payouts', icon: Wallet },
    ],
  },
  {
    label: 'TOOLS',
    items: [
      { label: 'My Network', href: '/creators/portal/network', icon: Users },
      { label: 'Resources', href: '/creators/portal/resources', icon: BookOpen },
    ],
  },
  {
    label: null,
    items: [
      { label: 'Settings', href: '/creators/portal/settings', icon: Settings },
      { label: 'Support', href: '/creators/portal/support', icon: LifeBuoy },
    ],
  },
]

interface CreatorSidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
}

export function CreatorSidebar({ mobileOpen, onClose }: CreatorSidebarProps) {
  const pathname = usePathname()

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 pb-4">
        <Link href="/" className="text-xl font-display font-bold text-cultr-forest" style={{ fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif" }}>
          CULTR <span className="text-sm font-body font-normal text-cultr-textMuted">Creator</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1 text-cultr-textMuted hover:text-cultr-forest">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 space-y-4 overflow-y-auto">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="px-3 mb-1 text-[10px] font-semibold tracking-widest text-stone-400 uppercase">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-cultr-forest text-white'
                        : 'text-cultr-textMuted hover:bg-cultr-mint hover:text-cultr-forest'
                    }`}
                  >
                    <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-stone-200">
        <Link
          href="/"
          className="text-xs text-cultr-textMuted hover:text-cultr-forest transition-colors"
        >
          Back to <span className="font-display font-bold tracking-[0.08em]">CULTR</span> Health
        </Link>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-60 md:fixed md:inset-y-0 bg-white border-r border-stone-200 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          <aside className="md:hidden fixed inset-y-0 left-0 w-72 bg-white z-50 shadow-xl">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}
