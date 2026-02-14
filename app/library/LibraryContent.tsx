'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  LogOut,
  Search,
  ArrowRight,
  LayoutDashboard,
  Library,
  Settings,
  CreditCard,
  HeadphonesIcon,
} from 'lucide-react'
import { CategoryGrid } from '@/components/library/CategoryGrid'
import { MemberDashboard } from '@/components/library/MemberDashboard'
import type { LibraryAccess, PlanTier } from '@/lib/config/plans'
import { STRIPE_CONFIG } from '@/lib/config/plans'

type TabId = 'dashboard' | 'library' | 'account';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'library', label: 'Peptide Library', icon: Library },
  { id: 'account', label: 'Account', icon: Settings },
]

export function LibraryContent({
  email,
  tier,
  libraryAccess,
}: {
  email: string
  tier: PlanTier | null
  libraryAccess: LibraryAccess
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.refresh()
  }

  const tierDisplay = tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : 'Member'

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Tier Badge */}
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xl font-display font-bold text-stone-900">
                CULTR
              </Link>
              <span className="hidden sm:inline-flex px-3 py-1 bg-stone-900 text-white text-xs font-medium rounded-full">
                {tierDisplay}
              </span>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              {TABS.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <span className="hidden lg:block text-sm text-stone-500">{email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <MemberDashboard
            tier={tier}
            libraryAccess={libraryAccess}
            email={email}
          />
        )}

        {/* Library Tab */}
        {activeTab === 'library' && (
          <div className="space-y-12">
            {/* Library Header */}
            <div>
              <h1 className="text-3xl font-display font-bold text-stone-900">
                Peptide Library
              </h1>
              <p className="text-stone-600 mt-2">
                Comprehensive reference guides for 80+ compounds
              </p>
            </div>

            {/* New Category Grid (Includes Master Index & Catalog) */}
            <CategoryGrid />

            {/* Search Hint */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-stone-500 text-sm">
                <Search className="w-4 h-4" />
                <span>Use the Master Index for quick product lookup</span>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="p-6 bg-stone-100 border border-stone-200 rounded-2xl">
              <p className="text-stone-500 text-xs leading-relaxed">
                <strong className="text-stone-700">Disclaimer:</strong> All peptides listed are for research purposes only.
                This information is educational and should not be considered medical advice.
                Always consult with a qualified healthcare provider before using any compound.
                CULTR Health does not sell or distribute peptides directly.
              </p>
            </div>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-display font-bold text-stone-900">
                Account Settings
              </h1>
              <p className="text-stone-600 mt-2">
                Manage your membership and billing
              </p>
            </div>

            {/* Membership Info */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6">
              <h2 className="text-lg font-display font-bold text-stone-900 mb-4">Current Plan</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-display font-bold text-stone-900">
                    CULTR {tierDisplay}
                  </p>
                  <p className="text-stone-500 text-sm mt-1">{email}</p>
                </div>
                <span className="px-4 py-2 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">
                  Active
                </span>
              </div>
            </div>

            {/* Billing Actions */}
            <div className="grid md:grid-cols-2 gap-4">
              <a
                href={STRIPE_CONFIG.customerPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 px-6 py-5 bg-white border border-stone-200 rounded-2xl hover:border-stone-300 hover:shadow-lg hover:shadow-stone-200/50 transition-all"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <CreditCard className="w-6 h-6 text-blue-700" />
                </div>
                <div className="flex-1">
                  <p className="text-stone-900 font-medium">Manage Billing</p>
                  <p className="text-stone-500 text-sm">Update payment method, view invoices</p>
                </div>
                <ArrowRight className="w-5 h-5 text-stone-300 group-hover:text-stone-500 group-hover:translate-x-1 transition-all" />
              </a>
              <a
                href={STRIPE_CONFIG.customerPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 px-6 py-5 bg-white border border-stone-200 rounded-2xl hover:border-stone-300 hover:shadow-lg hover:shadow-stone-200/50 transition-all"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <Settings className="w-6 h-6 text-purple-700" />
                </div>
                <div className="flex-1">
                  <p className="text-stone-900 font-medium">Subscription Settings</p>
                  <p className="text-stone-500 text-sm">Change plan, cancel subscription</p>
                </div>
                <ArrowRight className="w-5 h-5 text-stone-300 group-hover:text-stone-500 group-hover:translate-x-1 transition-all" />
              </a>
            </div>

            {/* Upgrade CTA */}
            {tier && tier !== 'club' && (
              <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl p-6 text-white">
                <h3 className="text-lg font-display font-bold mb-2">Upgrade Your Plan</h3>
                <p className="text-white/70 text-sm mb-4">
                  Unlock more features with a higher tier membership
                </p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-stone-900 rounded-full text-sm font-medium hover:bg-stone-100 transition-colors"
                >
                  View All Plans
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Need Help Banner */}
      <div className="border-t border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-center">
          <a
            href="mailto:support@cultrhealth.com"
            className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors"
          >
            <HeadphonesIcon className="w-4 h-4" />
            <span>Need Help? <span className="underline underline-offset-2">Contact a Care Coordinator</span></span>
          </a>
        </div>
      </div>
    </div>
  )
}
