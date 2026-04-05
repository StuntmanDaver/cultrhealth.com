'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Layers, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================
// NAV CONFIGURATION
// ============================================================

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/portal/dashboard', icon: LayoutDashboard },
  // DEACTIVATED — stacking guides hidden for now; re-enable later
  // { label: 'Stacking Guides', href: '/portal/stacking', icon: Layers },
]

// ============================================================
// PORTAL SIDEBAR
// ============================================================

interface PortalSidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
}

export function PortalSidebar({ mobileOpen = false, onClose }: PortalSidebarProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const sidebarContent = (
    <>
      {/* Brand header */}
      <div className="px-6 py-6">
        <Link href="/portal/dashboard" className="block">
          <img src="/images/email-logo-cream.png" alt="CULTR Health" className="h-10 w-auto" />
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                active
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="w-[18px] h-[18px]" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom link */}
      <div className="px-3 py-4 border-t border-white/10">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-white/80 transition-colors"
        >
          Back to CULTR Health
        </Link>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-col md:w-60 md:fixed md:inset-y-0 bg-brand-primary z-30">
        {sidebarContent}
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          'md:hidden fixed inset-y-0 left-0 w-72 bg-brand-primary z-50 shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Close button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={onClose}
            className="p-1 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {sidebarContent}
      </div>
    </>
  )
}
