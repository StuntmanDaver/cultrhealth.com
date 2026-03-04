'use client'

import Link from 'next/link'
import { Activity, Zap, Heart, Brain, BookOpen, Search, ArrowRight, Pill, Dumbbell } from 'lucide-react'

// Define the categories manually to assign icons and specific layouts
const CATEGORIES = [
  {
    id: 'growth-factors',
    name: 'Growth Factors & Anabolic',
    description: 'Muscle building, strength enhancement, anabolic pathways',
    icon: Activity,
    color: 'emerald',
    tags: ['IGF-1 LR3', 'Follistatin', 'Sermorelin', 'Hexarelin']
  },
  {
    id: 'repair-recovery',
    name: 'Repair & Recovery',
    description: 'Tissue repair, tendon/ligament healing, wound recovery',
    icon: Heart,
    color: 'rose',
    tags: ['BPC-157', 'TB-500', 'GHK-Cu', 'GLOW Blend']
  },
  {
    id: 'metabolic',
    name: 'Metabolic & Weight Loss',
    description: 'Fat loss, appetite control, GLP-1 agonists, metabolic health',
    icon: Zap,
    color: 'amber',
    tags: ['Cagrilintide', 'Semaglutide', 'AOD-9604']
  },
  {
    id: 'bioregulators',
    name: 'Bioregulators & Neuropeptides',
    description: 'Immune support, sleep, cognition, anti-aging',
    icon: Brain,
    color: 'indigo',
    tags: ['Epitalon', 'DSIP', 'Thymosin', 'SEMAX']
  }
]

export function CategoryGrid() {
  return (
    <div className="space-y-12">
      {/* Primary Tools */}
      <div className="grid md:grid-cols-3 gap-6">
        <Link
          href="/library/index"
          className="group relative overflow-hidden bg-white border border-stone-200 rounded-2xl p-8 hover:shadow-xl hover:border-cultr-mint/50 transition-all"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <BookOpen className="w-32 h-32 text-cultr-forest" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-cultr-mint/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-cultr-mint/30 transition-colors">
              <BookOpen className="w-6 h-6 text-cultr-forest" />
            </div>
            <h3 className="text-2xl font-display font-bold text-stone-900 mb-2">Master Index</h3>
            <p className="text-stone-600 mb-6 max-w-sm">
              Quick lookup by category and use case. The best starting point for finding specific protocols.
            </p>
            <div className="flex items-center gap-2 text-cultr-forest font-medium group-hover:gap-3 transition-all">
              Browse Index <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Link>

        <Link
          href="/library/products"
          className="group relative overflow-hidden bg-white border border-stone-200 rounded-2xl p-8 hover:shadow-xl hover:border-cultr-mint/50 transition-all"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Search className="w-32 h-32 text-cultr-forest" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors">
              <Pill className="w-6 h-6 text-blue-700" />
            </div>
            <h3 className="text-2xl font-display font-bold text-stone-900 mb-2">Full Product Catalog</h3>
            <p className="text-stone-600 mb-6 max-w-sm">
              Detailed technical specifications, dosing protocols, and purchasing information for all 80+ compounds.
            </p>
            <div className="flex items-center gap-2 text-blue-700 font-medium group-hover:gap-3 transition-all">
              View Catalog <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Link>

        <Link
          href="/library/stack-guides"
          className="group relative overflow-hidden bg-white border border-stone-200 rounded-2xl p-8 hover:shadow-xl hover:border-orange-200/50 transition-all"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Dumbbell className="w-32 h-32 text-orange-700" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-200 transition-colors">
              <Dumbbell className="w-6 h-6 text-orange-700" />
            </div>
            <h3 className="text-2xl font-display font-bold text-stone-900 mb-2">Stack Guides</h3>
            <p className="text-stone-600 mb-6 max-w-sm">
              Goal-based protocol stacks by persona — athlete, weight loss, focus, skin & more.
            </p>
            <div className="flex items-center gap-2 text-orange-700 font-medium group-hover:gap-3 transition-all">
              View Guides <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Link>
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-2xl font-display font-bold text-stone-900 mb-8">Browse by Category</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {CATEGORIES.map(category => {
            const Icon = category.icon
            return (
              <Link 
                key={category.id}
                href={`/library/${category.id}`}
                className="group bg-white border border-stone-200 rounded-2xl p-6 hover:shadow-lg hover:border-stone-300 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    category.color === 'emerald' ? 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200' :
                    category.color === 'rose' ? 'bg-rose-100 text-rose-700 group-hover:bg-rose-200' :
                    category.color === 'amber' ? 'bg-amber-100 text-amber-700 group-hover:bg-amber-200' :
                    'bg-indigo-100 text-indigo-700 group-hover:bg-indigo-200'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-stone-900 mb-1 group-hover:text-cultr-forest transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-stone-600 text-sm mb-4">
                      {category.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {category.tags.map(tag => (
                        <span key={tag} className="px-2.5 py-1 bg-stone-50 border border-stone-100 rounded-md text-xs font-medium text-stone-500">
                          {tag}
                        </span>
                      ))}
                      <span className="px-2.5 py-1 bg-stone-50 border border-stone-100 rounded-md text-xs font-medium text-stone-400">
                        +2 more
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
