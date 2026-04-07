'use client'

import { useState } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { Menu } from 'lucide-react'

export function AdminLayoutClient({
  email,
  children,
}: {
  email: string
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-cream">
      <AdminSidebar
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="md:pl-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 md:px-8 py-3 bg-white border-b border-brand-primary/10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-1.5 text-brand-primary/60 hover:text-brand-primary rounded-lg hover:bg-brand-primary/5 transition-colors"
            aria-label="Open navigation menu"
            aria-expanded={sidebarOpen}
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm text-brand-primary/60 truncate">{email}</span>
        </div>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
