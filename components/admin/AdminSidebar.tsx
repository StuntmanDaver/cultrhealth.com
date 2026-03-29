'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  CreditCard,
  ClipboardList,
  Network,
  Tag,
  UserCheck,
  Wallet,
  QrCode,
  Clock,
  X,
  LogOut,
  Video,
} from 'lucide-react'

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    label: 'REVENUE',
    items: [
      { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    ],
  },
  {
    label: 'CUSTOMERS',
    items: [
      { label: 'Customers', href: '/admin/customers', icon: Users },
      { label: 'Members', href: '/admin/members', icon: CreditCard },
      { label: 'Intakes', href: '/admin/intakes', icon: ClipboardList },
      { label: 'Consultations', href: '/admin/consultations', icon: Video },
    ],
  },
  {
    label: 'CREATORS',
    items: [
      { label: 'Network', href: '/admin/creators', icon: Network },
      { label: 'Coupons & Links', href: '/admin/creators/coupons', icon: Tag },
      { label: 'Approvals', href: '/admin/creators/approvals', icon: UserCheck },
      { label: 'Payouts', href: '/admin/creators/payouts', icon: Wallet },
    ],
  },
  {
    label: 'MARKETING',
    items: [
      { label: 'QR Analytics', href: '/admin/marketing', icon: QrCode },
      { label: 'Waitlist', href: '/admin/marketing/waitlist', icon: Clock },
    ],
  },
]

interface AdminSidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
}

export function AdminSidebar({ mobileOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

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
    return pathname === href
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 pb-4">
        <Link href="/admin" className="text-xl font-display font-bold text-cultr-forest" style={{ fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif" }}>
          CULTR <span className="text-sm font-body font-normal text-cultr-textMuted">Admin</span>
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
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      active
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
