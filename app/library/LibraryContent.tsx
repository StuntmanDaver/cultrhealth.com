'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Dumbbell,
  Scale,
  Brain,
  LogOut,
  Search,
  FileText,
  ArrowRight,
  ShoppingCart,
  LayoutDashboard,
  Library,
  Settings,
  CreditCard,
  Flame,
} from 'lucide-react'
import { CategoryGrid } from '@/components/library/CategoryGrid'
import { TierGate } from '@/components/library/TierGate'
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
                cultr<span className="text-stone-400">.</span>
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
                Peptide <span className="italic">Library</span>
              </h1>
              <p className="text-stone-600 mt-2">
                Comprehensive reference guides for 80+ compounds
              </p>
            </div>

            {/* New Category Grid (Includes Master Index & Catalog) */}
            <CategoryGrid />

            {/* Protocol Tools */}
            <div>
              <h2 className="text-xl font-display font-bold text-stone-900 mb-4">Protocol Tools</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <TierGate
                  requiredTier="catalyst"
                  currentTier={tier}
                  upgradeMessage="Upgrade to Catalyst+ to unlock dosing calculators."
                >
                  <Link
                    href="/library/dosing-calculator"
                    className="group flex items-center gap-4 px-6 py-5 bg-white border border-stone-200 rounded-2xl hover:border-stone-300 hover:shadow-lg hover:shadow-stone-200/50 transition-all"
                  >
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                      <Scale className="w-6 h-6 text-purple-700" />
                    </div>
                    <div className="flex-1">
                      <p className="text-stone-900 font-medium">Dosing Calculators</p>
                      <p className="text-stone-500 text-sm">Peptide reconstitution & syringe dosing</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-stone-300 group-hover:text-stone-500 group-hover:translate-x-1 transition-all" />
                  </Link>
                </TierGate>
                <TierGate
                  requiredTier="catalyst"
                  currentTier={tier}
                  upgradeMessage="Upgrade to Catalyst+ to unlock the calorie calculator."
                >
                  <Link
                    href="/library/calorie-calculator"
                    className="group flex items-center gap-4 px-6 py-5 bg-white border border-stone-200 rounded-2xl hover:border-stone-300 hover:shadow-lg hover:shadow-stone-200/50 transition-all"
                  >
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                      <Flame className="w-6 h-6 text-orange-700" />
                    </div>
                    <div className="flex-1">
                      <p className="text-stone-900 font-medium">Calorie & Macro Calculator</p>
                      <p className="text-stone-500 text-sm">BMR, TDEE & macro planning</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-stone-300 group-hover:text-stone-500 group-hover:translate-x-1 transition-all" />
                  </Link>
                </TierGate>
                <TierGate
                  requiredTier="catalyst"
                  currentTier={tier}
                  upgradeMessage="Upgrade to Catalyst+ to unlock stacking guides."
                >
                  <div className="flex items-center gap-4 px-6 py-5 bg-white border border-stone-200 rounded-2xl">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Dumbbell className="w-6 h-6 text-orange-700" />
                    </div>
                    <div className="flex-1">
                      <p className="text-stone-900 font-medium">Stacking Guides</p>
                      <p className="text-stone-500 text-sm">Protocol combinations and sequencing</p>
                    </div>
                  </div>
                </TierGate>
              </div>
            </div>

            {/* Members Shop */}
            <div>
              <h2 className="text-xl font-display font-bold text-stone-900 mb-4">Members Shop</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <TierGate
                  requiredTier="catalyst"
                  currentTier={tier}
                  upgradeMessage="Upgrade to Catalyst+ to access the product shop."
                >
                  <Link
                    href="/library/shop"
                    className="group flex items-center gap-4 px-6 py-5 bg-stone-900 text-white rounded-2xl hover:bg-stone-800 transition-all"
                  >
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <ShoppingCart className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">Product Shop</p>
                      <p className="text-white/70 text-sm">Browse 130+ peptides and request quotes</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </Link>
                </TierGate>
                <div className="flex items-center gap-4 px-6 py-5 bg-white border border-stone-200 rounded-2xl">
                  <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-stone-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-stone-900 font-medium">Quote History</p>
                    <p className="text-stone-500 text-sm">View past quote requests</p>
                    <span className="text-xs text-stone-400 italic">Coming soon</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Provider Resources */}
            <div>
              <h2 className="text-xl font-display font-bold text-stone-900 mb-4">Provider Resources</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <TierGate
                  requiredTier="concierge"
                  currentTier={tier}
                  upgradeMessage="Upgrade to Concierge to unlock provider note templates."
                >
                  <div className="flex items-center gap-4 px-6 py-5 bg-white border border-stone-200 rounded-2xl">
                    <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-stone-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-stone-900 font-medium">Provider Note Templates</p>
                      <p className="text-stone-500 text-sm">High-touch documentation workflows</p>
                    </div>
                  </div>
                </TierGate>
                <TierGate
                  requiredTier="club"
                  currentTier={tier}
                  upgradeMessage="Upgrade to Club to unlock custom protocol requests."
                >
                  <div className="flex items-center gap-4 px-6 py-5 bg-white border border-stone-200 rounded-2xl">
                    <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center">
                      <Brain className="w-6 h-6 text-stone-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-stone-900 font-medium">Custom Protocol Requests</p>
                      <p className="text-stone-500 text-sm">White-glove protocol design with your provider</p>
                    </div>
                  </div>
                </TierGate>
              </div>
            </div>

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
                Account <span className="italic">Settings</span>
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
    </div>
  )
}
