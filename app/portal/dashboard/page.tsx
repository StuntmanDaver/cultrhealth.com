'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { LogOut } from 'lucide-react'

export default function PortalDashboardPage() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch('/api/portal/logout', { method: 'POST' })
    } catch {
      // Best-effort logout
    }
    router.replace('/portal/login')
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-center">
      <h1 className="text-3xl md:text-4xl font-display font-bold text-brand-primary mb-4">
        Welcome to your portal
      </h1>
      <p className="text-brand-primary/60 mb-10">
        Your dashboard is being built. Check back soon.
      </p>

      <Button
        variant="secondary"
        onClick={handleLogout}
        isLoading={isLoggingOut}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Log Out
      </Button>
    </div>
  )
}
