'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Dumbbell,
  Heart,
  Scale,
  Brain,
  BookOpen,
  LogOut,
  Search,
  FileText,
  ArrowRight,
  ShoppingCart
} from 'lucide-react'
import { TierGate } from '@/components/library/TierGate'
import type { LibraryAccess, PlanTier } from '@/lib/config/plans'

const CATEGORIES = [
  {
    slug: 'growth-factors',
    name: 'Growth Factors & Anabolic',
    description: 'Muscle building, strength enhancement, anabolic pathways',
    icon: Dumbbell,
    products: ['IGF-1 LR3', 'ACE-031', 'Follistatin 344', 'Sermorelin', 'CJC-1295', 'Ipamorelin'],
  },
  {
    slug: 'repair-recovery',
    name: 'Repair & Recovery',
    description: 'Tissue repair, tendon/ligament healing, wound recovery',
    icon: Heart,
    products: ['BPC-157', 'TB-500', 'GHK-Cu', 'GLOW Blend', 'Elamipretide', 'TP508'],
  },
  {
    slug: 'metabolic',
    name: 'Metabolic & Weight Loss',
    description: 'Fat loss, appetite control, GLP-1 agonists, metabolic health',
    icon: Scale,
    products: ['Cagrilintide', 'Sema + Cagri Blend', 'FRAG 176-191 + AOD 9604'],
  },
  {
    slug: 'bioregulators',
    name: 'Bioregulators & Neuropeptides',
    description: 'Immune support, sleep, cognition, anti-aging',
    icon: Brain,
    products: ['Epitalon', 'DSIP', 'Thymosin-α1', 'SEMAX', 'SELANK', 'Humanin'],
  },
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
  const isTitlesOnly = libraryAccess.masterIndex === 'titles_only'

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <section className="py-16 px-6 bg-cultr-forest text-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-display font-bold mb-2">
                Peptide <span className="italic">Library</span>
              </h1>
              <p className="text-white/80">
                Comprehensive reference guides for 80+ compounds
              </p>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-white/60 text-sm hidden md:block">{email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Quick Access */}
          <div className="mb-12 grid md:grid-cols-2 gap-4">
            <Link
              href="/library/index"
              className="group flex items-center gap-4 px-6 py-5 bg-cultr-offwhite border border-cultr-sage rounded-2xl hover:border-cultr-forest/50 transition-all"
            >
              <div className="w-12 h-12 bg-cultr-mint rounded-xl flex items-center justify-center group-hover:bg-cultr-sage transition-colors">
                <BookOpen className="w-6 h-6 text-cultr-forest" />
              </div>
              <div className="flex-1">
                <p className="text-cultr-text font-display font-bold">Master Index</p>
                <p className="text-cultr-textMuted text-sm">
                  {isTitlesOnly ? 'Titles-only view on Core' : 'Quick lookup by category and use case'}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-cultr-textMuted group-hover:text-cultr-forest transition-colors" />
            </Link>
            <TierGate
              requiredTier="creator"
              currentTier={tier}
              upgradeMessage="Upgrade to Creator to unlock advanced protocol cards."
            >
              <Link
                href="/library/products"
                className="group flex items-center gap-4 px-6 py-5 bg-cultr-offwhite border border-cultr-sage rounded-2xl hover:border-cultr-forest/50 transition-all"
              >
                <div className="w-12 h-12 bg-cultr-mint rounded-xl flex items-center justify-center group-hover:bg-cultr-sage transition-colors">
                  <FileText className="w-6 h-6 text-cultr-forest" />
                </div>
                <div className="flex-1">
                  <p className="text-cultr-text font-display font-bold">Full Product Catalog</p>
                  <p className="text-cultr-textMuted text-sm">Detailed protocol cards for all 80+ compounds</p>
                </div>
                <ArrowRight className="w-5 h-5 text-cultr-textMuted group-hover:text-cultr-forest transition-colors" />
              </Link>
            </TierGate>
          </div>

          {/* Section Title */}
          <h2 className="text-xl font-display font-bold text-cultr-forest mb-6">Browse by Category</h2>

          {/* Categories Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {CATEGORIES.map((category) => {
              const Icon = category.icon
              return (
                <Link
                  key={category.slug}
                  href={`/library/${category.slug}`}
                  className="group bg-cultr-offwhite border border-cultr-sage rounded-2xl p-6 hover:border-cultr-forest/50 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 bg-cultr-mint rounded-xl flex items-center justify-center group-hover:bg-cultr-sage transition-colors">
                      <Icon className="w-7 h-7 text-cultr-forest" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-display font-bold text-cultr-text mb-1 group-hover:text-cultr-forest transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-cultr-textMuted text-sm">{category.description}</p>
                    </div>
                  </div>

                  {/* Product Tags */}
                  <div className="flex flex-wrap gap-2">
                    {category.products.slice(0, 4).map((product) => (
                      <span
                        key={product}
                        className="px-3 py-1 bg-white border border-cultr-sage rounded-full text-xs text-cultr-textMuted"
                      >
                        {product}
                      </span>
                    ))}
                    {category.products.length > 4 && (
                      <span className="px-3 py-1 text-xs text-cultr-forest font-medium">
                        +{category.products.length - 4} more
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Protocol Tools */}
          <div className="mt-14">
            <h2 className="text-xl font-display font-bold text-cultr-forest mb-6">Protocol Tools</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <TierGate
                requiredTier="catalyst"
                currentTier={tier}
                upgradeMessage="Upgrade to Catalyst+ to unlock dosing calculators."
              >
                <Link
                  href="/library/dosing-calculator"
                  className="group flex items-center gap-4 px-6 py-5 bg-cultr-offwhite border border-cultr-sage rounded-2xl hover:border-cultr-forest/50 transition-all"
                >
                  <div className="w-12 h-12 bg-cultr-mint rounded-xl flex items-center justify-center group-hover:bg-cultr-sage transition-colors">
                    <Scale className="w-6 h-6 text-cultr-forest" />
                  </div>
                  <div className="flex-1">
                    <p className="text-cultr-text font-display font-bold">Dosing Calculators</p>
                    <p className="text-cultr-textMuted text-sm">Peptide reconstitution & syringe dosing</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-cultr-textMuted group-hover:text-cultr-forest transition-colors" />
                </Link>
              </TierGate>
              <TierGate
                requiredTier="catalyst"
                currentTier={tier}
                upgradeMessage="Upgrade to Catalyst+ to unlock stacking guides."
              >
                <div className="flex items-center gap-4 px-6 py-5 bg-cultr-offwhite border border-cultr-sage rounded-2xl">
                  <div className="w-12 h-12 bg-cultr-mint rounded-xl flex items-center justify-center">
                    <Dumbbell className="w-6 h-6 text-cultr-forest" />
                  </div>
                  <div className="flex-1">
                    <p className="text-cultr-text font-display font-bold">Stacking Guides</p>
                    <p className="text-cultr-textMuted text-sm">Protocol combinations and sequencing</p>
                  </div>
                </div>
              </TierGate>
            </div>
          </div>

          {/* Members Shop */}
          <div className="mt-14">
            <h2 className="text-xl font-display font-bold text-cultr-forest mb-6">Members Shop</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <TierGate
                requiredTier="catalyst"
                currentTier={tier}
                upgradeMessage="Upgrade to Catalyst+ to access the product shop."
              >
                <Link
                  href="/library/shop"
                  className="group flex items-center gap-4 px-6 py-5 bg-cultr-forest text-white rounded-2xl hover:bg-cultr-forest/90 transition-all"
                >
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-display font-bold">Product Shop</p>
                    <p className="text-white/70 text-sm">Browse 130+ peptides and request quotes</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
                </Link>
              </TierGate>
              <div className="flex items-center gap-4 px-6 py-5 bg-cultr-offwhite border border-cultr-sage rounded-2xl">
                <div className="w-12 h-12 bg-cultr-mint rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-cultr-forest" />
                </div>
                <div className="flex-1">
                  <p className="text-cultr-text font-display font-bold">Quote History</p>
                  <p className="text-cultr-textMuted text-sm">View past quote requests</p>
                  <span className="text-xs text-cultr-sage italic">Coming soon</span>
                </div>
              </div>
            </div>
          </div>

          {/* Provider Resources */}
          <div className="mt-14">
            <h2 className="text-xl font-display font-bold text-cultr-forest mb-6">Provider Resources</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <TierGate
                requiredTier="concierge"
                currentTier={tier}
                upgradeMessage="Upgrade to Concierge to unlock provider note templates."
              >
                <div className="flex items-center gap-4 px-6 py-5 bg-cultr-offwhite border border-cultr-sage rounded-2xl">
                  <div className="w-12 h-12 bg-cultr-mint rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-cultr-forest" />
                  </div>
                  <div className="flex-1">
                    <p className="text-cultr-text font-display font-bold">Provider Note Templates</p>
                    <p className="text-cultr-textMuted text-sm">High-touch documentation workflows</p>
                  </div>
                </div>
              </TierGate>
              <TierGate
                requiredTier="club"
                currentTier={tier}
                upgradeMessage="Upgrade to Club to unlock custom protocol requests."
              >
                <div className="flex items-center gap-4 px-6 py-5 bg-cultr-offwhite border border-cultr-sage rounded-2xl">
                  <div className="w-12 h-12 bg-cultr-mint rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6 text-cultr-forest" />
                  </div>
                  <div className="flex-1">
                    <p className="text-cultr-text font-display font-bold">Custom Protocol Requests</p>
                    <p className="text-cultr-textMuted text-sm">White-glove protocol design with your provider</p>
                  </div>
                </div>
              </TierGate>
            </div>
          </div>

          {/* Search Hint */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 text-cultr-textMuted text-sm">
              <Search className="w-4 h-4" />
              <span>Use the Master Index for quick product lookup</span>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-16 p-6 bg-cultr-mint border border-cultr-sage rounded-2xl">
            <p className="text-cultr-textMuted text-xs leading-relaxed">
              <strong className="text-cultr-text">Disclaimer:</strong> All peptides listed are for research purposes only.
              This information is educational and should not be considered medical advice.
              Always consult with a qualified healthcare provider before using any compound.
              CULTR Health does not sell or distribute peptides directly.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
