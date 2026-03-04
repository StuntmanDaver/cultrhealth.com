'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CreatorProvider } from '@/lib/contexts/CreatorContext'
import { CreatorSidebar } from '@/components/creators/CreatorSidebar'
import { CreatorHeader } from '@/components/creators/CreatorHeader'

export default function CreatorPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const router = useRouter()

  // Check if creator is authenticated by hitting the profile API
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/creators/profile')
        if (!res.ok) {
          router.replace('/creators/login')
          return
        }
        setAuthChecked(true)
      } catch {
        router.replace('/creators/login')
      }
    }
    checkAuth()
  }, [router])

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-pulse space-y-4 text-center">
          <div className="h-6 w-32 bg-stone-200 rounded mx-auto" />
          <div className="h-4 w-48 bg-stone-100 rounded mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <CreatorProvider>
      <div className="min-h-screen bg-cream">
        <CreatorSidebar
          mobileOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="md:pl-60 flex flex-col min-h-screen">
          <CreatorHeader onMenuToggle={() => setSidebarOpen(true)} />

          <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </CreatorProvider>
  )
}
