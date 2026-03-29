'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { MemberSidebar } from '@/components/library/MemberSidebar'

export function LibrarySidebarShell({ children, isProvider }: { children: React.ReactNode; isProvider?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen">
      <MemberSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} isProvider={isProvider} />

      {/* Mobile top bar with hamburger */}
      <div className="md:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-white border-b border-stone-200">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-cultr-forest hover:bg-cultr-mint rounded-xl transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <img src="/cultr-health-logo.png" alt="CULTR Health" className="h-6 w-auto" />
      </div>

      <main className="md:pl-60 min-h-screen bg-brand-cream">
        {children}
      </main>
    </div>
  )
}
