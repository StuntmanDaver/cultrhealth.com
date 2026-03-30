'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { ProviderSidebar } from '@/components/provider/ProviderSidebar'

export function ProviderLayoutClient({
  email,
  children,
}: {
  email: string
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-brand-cream">
      <ProviderSidebar
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="md:pl-60 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-white border-b border-stone-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-cultr-forest hover:bg-cultr-mint rounded-xl transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <img src="/cultr-health-logo.png" alt="CULTR Health" className="h-6 w-auto" />
        </div>

        {/* Desktop top bar */}
        <div className="hidden md:flex items-center justify-end px-8 py-3 bg-white border-b border-stone-200">
          <span className="text-sm text-brand-primary/60 truncate">{email}</span>
        </div>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
