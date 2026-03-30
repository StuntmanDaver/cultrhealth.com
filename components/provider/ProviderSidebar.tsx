'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Video,
  FlaskConical,
  X,
  LogOut,
} from 'lucide-react'

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { label: 'Consultations', href: '/provider/consultations', icon: Video },
      { label: 'Protocol Builder', href: '/provider/protocol-builder', icon: FlaskConical },
    ],
  },
]

interface ProviderSidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
}

export function ProviderSidebar({ mobileOpen, onClose }: ProviderSidebarProps) {
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
    return pathname === href || pathname.startsWith(href + '/')
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 pb-4">
        <Link href="/provider/consultations" className="flex items-center gap-2">
          <img src="/cultr-health-logo.png" alt="CULTR Health" className="h-16 w-auto" />
        </Link>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1 text-cultr-textMuted hover:text-cultr-forest">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <p className="px-6 mb-3 text-[10px] font-semibold tracking-widest text-stone-400 uppercase">
        Provider Tools
      </p>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV_GROUPS[0].items.map((item) => {
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
