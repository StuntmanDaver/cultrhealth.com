'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { PlanTier } from '@/lib/config/plans'
import {
  LayoutDashboard,
  TestTube2,
  Library,
  HelpCircle,
  Calculator,
  Flame,
  ShoppingBag,
  ShoppingCart,
  CreditCard,
  X,
  LogOut,
} from 'lucide-react'

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { label: 'Dashboard', href: '/members', icon: LayoutDashboard },
    ],
  },
  {
    label: 'MY CARE',
    items: [
      { label: 'Labs & Results', href: '/members/labs', icon: TestTube2 },
    ],
  },
  {
    label: 'LEARN',
    items: [
      { label: 'Peptide Library', href: '/members/index', icon: Library },
      { label: 'Peptide FAQ', href: '/members/peptide-faq', icon: HelpCircle },
    ],
  },
  {
    label: 'TOOLS',
    items: [
      { label: 'Dosing Calculator', href: '/members/dosing-calculator', icon: Calculator },
      { label: 'Calorie Calculator', href: '/members/calorie-calculator', icon: Flame },
    ],
  },
  {
    label: 'SHOP',
    items: [
      { label: 'Browse Products', href: '/members/shop', icon: ShoppingBag },
      { label: 'Cart', href: '/members/cart', icon: ShoppingCart },
    ],
  },
  {
    label: 'ACCOUNT',
    items: [
      { label: 'Manage Billing', href: 'https://billing.stripe.com/p/login/4gM00igPh021086fle6J200', icon: CreditCard },
    ],
  },
]

// Provider nav group removed — providers now use Healthie dashboard directly

interface MemberSidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
  isProvider?: boolean
  tier?: PlanTier | null
}

export function MemberSidebar({ mobileOpen, onClose, isProvider, tier }: MemberSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const navGroups = NAV_GROUPS

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Best-effort
    }
    router.replace('/login')
  }

  const isActive = (href: string) => {
    if (href === '/members') return pathname === '/members'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 pb-4">
        <Link href="/" className="flex items-center gap-2">
          <img src="/cultr-health-logo.png" alt="CULTR Health" className="h-16 w-auto" />
        </Link>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1 text-cultr-textMuted hover:text-cultr-forest">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 space-y-4 overflow-y-auto">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="px-3 mb-1 text-[10px] font-semibold tracking-widest text-stone-400 uppercase">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href)
                const isExternal = item.href.startsWith('http')
                const className = `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-cultr-forest text-white'
                    : 'text-cultr-textMuted hover:bg-cultr-mint hover:text-cultr-forest'
                }`
                return isExternal ? (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
                    <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={className}
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

      <div className="p-4 border-t border-stone-200 space-y-3">
        <Link
          href="/"
          className="block text-xs text-cultr-textMuted hover:text-cultr-forest transition-colors"
        >
          Back to <span className="font-display font-bold">CULTR</span> Health
        </Link>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-2 text-xs text-cultr-textMuted hover:text-red-600 transition-colors disabled:opacity-50"
        >
          <LogOut className="w-3.5 h-3.5" />
          {loggingOut ? 'Logging out...' : 'Log Out'}
        </button>
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
