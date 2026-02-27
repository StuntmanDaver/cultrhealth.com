import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Shield, Star, ExternalLink } from 'lucide-react'
import { brandify } from '@/lib/utils'

// This would query the database in production — using static demo data for now
const DEMO_CREATORS: Record<string, {
  name: string
  bio: string
  socialHandle?: string
  tier: string
  defaultCode?: string
  defaultSlug?: string
}> = {
  'demo-creator': {
    name: 'Alex Johnson',
    bio: 'Health optimization enthusiast and fitness creator. I share my journey with peptide protocols, GLP-1 medications, and comprehensive lab testing through CULTR Health.',
    socialHandle: '@alexjohnson',
    tier: 'Gold',
    defaultCode: 'ALEXJ10',
    defaultSlug: 'alexj',
  },
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const creator = DEMO_CREATORS[slug]
  if (!creator) return { title: 'Creator Not Found | CULTR Health' }
  return {
    title: `${creator.name} | CULTR Creator`,
    description: creator.bio,
  }
}

export default async function CreatorProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const creator = DEMO_CREATORS[slug]

  if (!creator) {
    return (
      <div className="min-h-screen bg-cultr-cream flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-display font-bold text-cultr-forest mb-2">Creator not found</h1>
          <p className="text-sm text-cultr-textMuted mb-6">
            This creator profile doesn&apos;t exist or hasn&apos;t been set up yet.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 grad-dark text-white rounded-full text-sm font-medium hover:bg-cultr-forestDark transition-colors"
          >
            Visit <span className="font-display font-bold">CULTR</span> Health <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  const baseUrl = 'https://cultrhealth.com'

  return (
    <div className="min-h-screen bg-cultr-cream">
      {/* Header */}
      <div className="grad-dark">
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          {/* Avatar placeholder */}
          <div className="w-20 h-20 rounded-full bg-white/10 mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl font-display font-bold text-white">
              {creator.name.split(' ').map((n) => n[0]).join('')}
            </span>
          </div>

          <h1 className="text-2xl font-display font-bold text-white">{creator.name}</h1>

          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white/10 rounded-full text-xs text-white/80">
              <Star className="w-3 h-3" /> {creator.tier} Creator
            </span>
            {creator.socialHandle && (
              <span className="text-xs text-white/60">{creator.socialHandle}</span>
            )}
          </div>

          <p className="text-sm text-white/70 mt-4 max-w-lg mx-auto leading-relaxed">
            {brandify(creator.bio)}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 -mt-6">
        {/* Shop with code CTA */}
        {creator.defaultCode && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm mb-6">
            <div className="text-center">
              <p className="text-sm text-cultr-textMuted mb-2">Shop with my code for a discount</p>
              <div className="inline-flex items-center gap-3 px-6 py-3 grad-mint rounded-xl">
                <span className="text-lg font-display font-bold text-cultr-forest tracking-wide">
                  {creator.defaultCode}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="space-y-3 mb-8">
          <Link
            href={creator.defaultSlug ? `${baseUrl}/r/${creator.defaultSlug}` : '/quiz'}
            className="flex items-center justify-between p-4 grad-dark text-white rounded-2xl hover:bg-cultr-forestDark transition-colors group"
          >
            <div>
              <p className="font-display font-bold">Take the Quiz</p>
              <p className="text-sm text-white/70">Find your personalized health plan in 2 minutes</p>
            </div>
            <ArrowRight className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
          </Link>

          <Link
            href="/pricing"
            className="flex items-center justify-between p-4 bg-white border border-stone-200 rounded-2xl hover:border-cultr-forest transition-colors group"
          >
            <div>
              <p className="font-display font-bold text-cultr-forest">See Plans</p>
              <p className="text-sm text-cultr-textMuted">Starting from $199/mo — HSA/FSA eligible</p>
            </div>
            <ArrowRight className="w-5 h-5 text-stone-300 group-hover:text-cultr-forest transition-colors" />
          </Link>

          <Link
            href="/how-it-works"
            className="flex items-center justify-between p-4 bg-white border border-stone-200 rounded-2xl hover:border-cultr-forest transition-colors group"
          >
            <div>
              <p className="font-display font-bold text-cultr-forest">How It Works</p>
              <p className="text-sm text-cultr-textMuted">Learn about GLP-1 protocols and peptide therapy</p>
            </div>
            <ExternalLink className="w-5 h-5 text-stone-300 group-hover:text-cultr-forest transition-colors" />
          </Link>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 text-xs text-cultr-textMuted pb-12">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3" /> Licensed Providers
          </span>
          <span>·</span>
          <span>28–59 Biomarkers</span>
          <span>·</span>
          <span>HIPAA Compliant</span>
        </div>

        {/* Footer */}
        <div className="text-center pb-8">
          <Link href="/" className="text-xs text-cultr-textMuted hover:text-cultr-forest transition-colors">
            Powered by <span className="font-display font-bold">CULTR</span> Health
          </Link>
        </div>
      </div>
    </div>
  )
}
