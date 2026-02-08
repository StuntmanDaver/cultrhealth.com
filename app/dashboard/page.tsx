'use client'

import { MemberDashboard } from '@/components/library/MemberDashboard'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Your orders and protocols</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <MemberDashboard
          tier={null}
          libraryAccess={{
            masterIndex: 'titles_only',
            advancedProtocols: false,
            dosingCalculators: false,
            stackingGuides: false,
            providerNotes: false,
            customRequests: false,
          }}
          email=""
        />
      </main>
    </div>
  )
}
