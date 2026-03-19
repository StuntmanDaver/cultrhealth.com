'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export function AdminTopBar({ email }: { email: string }) {
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

  return (
    <div className="flex items-center justify-between px-4 md:px-8 py-2 bg-brand-primary text-brand-cream text-sm">
      <span className="truncate">{email}</span>
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="flex items-center gap-1.5 px-3 py-1 rounded-md hover:bg-white/10 transition-colors disabled:opacity-50"
      >
        <LogOut className="w-3.5 h-3.5" />
        {loggingOut ? 'Logging out...' : 'Log Out'}
      </button>
    </div>
  )
}
