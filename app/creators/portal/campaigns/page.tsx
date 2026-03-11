'use client'

import { useState } from 'react'
import { brandify } from '@/lib/utils'
import {
  Megaphone,
  Gift,
  Flame,
  Clock,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Tag,
  Calendar,
  Zap,
  Inbox,
} from 'lucide-react'
import { useCreator } from '@/lib/contexts/CreatorContext'

interface Campaign {
  id: string
  title: string
  description: string
  type: 'promo' | 'launch' | 'bonus' | 'announcement'
  status: 'active' | 'upcoming' | 'ended'
  startDate: string
  endDate?: string
  details: string[]
  cta?: { label: string; url?: string; copy?: string }
  badge?: string
}

const CAMPAIGNS: Campaign[] = [
  {
    id: 'spring-2026',
    title: 'Spring Optimization Push',
    description: 'Help your audience start spring with comprehensive lab testing. Special emphasis on GLP-1 and metabolic protocols.',
    type: 'promo',
    status: 'active',
    startDate: '2026-02-01',
    endDate: '2026-03-31',
    details: [
      'Focus messaging on "spring reset" and new health goals',
      'Highlight the 28-59 biomarker panel (SiPho Health) as a first step',
      'Push the quiz as a low-commitment entry point',
      'Use seasonal hooks: "New year goals, spring action"',
    ],
    cta: { label: 'Copy Spring Promo Caption', copy: "Spring is the perfect time to stop guessing and start optimizing. \n\nGet 28-59 biomarkers tested, matched with a licensed provider, and start a personalized protocol.\n\nPlans from $199/mo. Take the quiz \u2192 {LINK}\n\n#ad #cultrhealth #springreset" },
    badge: 'Active Now',
  },
  {
    id: 'glp1-awareness',
    title: 'GLP-1 Education Campaign',
    description: 'New FDA guidelines on compounded GLP-1s. Position CULTR as the trusted, compliant provider.',
    type: 'launch',
    status: 'active',
    startDate: '2026-01-15',
    details: [
      'Emphasize licensed providers + licensed pharmacies',
      'Address safety concerns proactively',
      'Share the GLP-1 Overview from Resources',
      'Avoid before/after transformation content',
      'Use approved claims only \u2014 review the Compliance section',
    ],
    cta: { label: 'View GLP-1 Talking Points', url: '/creators/portal/resources/glp-1-overview' },
    badge: 'Priority',
  },
  {
    id: 'referral-bonus-feb',
    title: 'February Referral Bonus',
    description: 'Extra $25 bonus per qualified referral through the end of February. Stacks on top of your normal 10% commission.',
    type: 'bonus',
    status: 'active',
    startDate: '2026-02-01',
    endDate: '2026-02-28',
    details: [
      '$25 bonus per new member who completes their first consultation',
      'Bonus applied automatically \u2014 no action needed from you',
      'Stacks with your normal 10% commission',
      'Unlimited bonus referrals during the campaign period',
    ],
    badge: 'Bonus Active',
  },
  {
    id: 'peptide-launch-q2',
    title: 'New Peptide Protocols \u2014 Q2 Launch',
    description: 'CULTR is expanding peptide offerings in Q2. New protocols for recovery and cognitive performance. Details coming soon.',
    type: 'announcement',
    status: 'upcoming',
    startDate: '2026-04-01',
    details: [
      'New recovery peptide stack launching',
      'Cognitive performance protocol in development',
      'Creator early access for content creation',
      'Full briefing materials will be shared before launch',
    ],
    badge: 'Coming Q2',
  },
]

const TYPE_ICONS: Record<string, React.ElementType> = {
  promo: Tag,
  launch: Zap,
  bonus: Gift,
  announcement: Megaphone,
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  upcoming: 'bg-blue-50 text-blue-700 border-blue-200',
  ended: 'bg-stone-50 text-stone-500 border-stone-200',
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const { links, codes } = useCreator()

  const Icon = TYPE_ICONS[campaign.type]
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://cultrhealth.com'
  const defaultLink = links.length > 0 ? `${baseUrl}/r/${links[0].slug}` : `${baseUrl}/r/your-link`
  const defaultCode = codes.length > 0 ? codes[0].code : 'YOURCODE'

  const handleCopyCta = async () => {
    if (!campaign.cta?.copy) return
    const personalized = campaign.cta.copy
      .replace(/\{LINK\}/g, defaultLink)
      .replace(/\{CODE\}/g, defaultCode)
    await navigator.clipboard.writeText(personalized)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden transition-all ${campaign.status === 'active' ? 'border-cultr-sage' : 'border-stone-200'}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-5 py-4 flex items-start gap-4"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          campaign.status === 'active' ? 'bg-cultr-mint' : campaign.status === 'ended' ? 'bg-stone-50' : 'bg-stone-100'
        }`}>
          <Icon className={`w-5 h-5 ${campaign.status === 'active' ? 'text-cultr-forest' : 'text-stone-400'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-display font-bold text-sm ${campaign.status === 'ended' ? 'text-stone-400' : 'text-cultr-forest'}`}>{campaign.title}</h3>
            {campaign.badge && (
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLES[campaign.status]}`}>
                {campaign.badge}
              </span>
            )}
          </div>
          <p className={`text-xs line-clamp-2 ${campaign.status === 'ended' ? 'text-stone-400' : 'text-cultr-textMuted'}`}>{brandify(campaign.description)}</p>
        </div>
        <ChevronRight className={`w-4 h-4 text-stone-300 shrink-0 mt-1 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-stone-100 pt-4 space-y-4">
          {/* Date range */}
          <div className="flex items-center gap-2 text-xs text-cultr-textMuted">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {new Date(campaign.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {campaign.endDate && ` \u2014 ${new Date(campaign.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
            </span>
          </div>

          {/* Action items */}
          <div>
            <p className="text-xs font-medium text-cultr-forest mb-2">Action Items</p>
            <ul className="space-y-1.5">
              {campaign.details.map((detail, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-cultr-textMuted">
                  <span className="w-1 h-1 rounded-full grad-dark mt-1.5 shrink-0" />
                  {detail}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          {campaign.cta && campaign.status !== 'ended' && (
            <div>
              {campaign.cta.copy ? (
                <button
                  onClick={handleCopyCta}
                  className="flex items-center gap-2 px-4 py-2 grad-dark text-white rounded-lg text-xs font-medium hover:bg-cultr-forestDark transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : campaign.cta.label}
                </button>
              ) : campaign.cta.url ? (
                <a
                  href={campaign.cta.url}
                  className="inline-flex items-center gap-2 px-4 py-2 grad-dark text-white rounded-lg text-xs font-medium hover:bg-cultr-forestDark transition-colors"
                >
                  {campaign.cta.label}
                  <ChevronRight className="w-3 h-3" />
                </a>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function CampaignsPage() {
  const [showPast, setShowPast] = useState(false)

  // Auto-expire campaigns whose endDate is in the past
  const now = new Date()
  const processedCampaigns = CAMPAIGNS.map(c => {
    if (c.endDate && new Date(c.endDate) < now && c.status === 'active') {
      return { ...c, status: 'ended' as const, badge: 'Ended' }
    }
    return c
  })

  const activeCampaigns = processedCampaigns.filter((c) => c.status === 'active')
  const upcomingCampaigns = processedCampaigns.filter((c) => c.status === 'upcoming')
  const endedCampaigns = processedCampaigns.filter((c) => c.status === 'ended')

  const hasNoCurrent = activeCampaigns.length === 0 && upcomingCampaigns.length === 0

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-cultr-forest">Campaigns</h1>
        <p className="text-sm text-cultr-textMuted mt-1">
          Active promotions, product launches, and bonus opportunities. Stay aligned with <span className="font-display font-bold">CULTR</span> messaging.
        </p>
      </div>

      {/* Empty state when no active or upcoming campaigns */}
      {hasNoCurrent && (
        <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center">
          <Inbox className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="font-display font-bold text-cultr-forest mb-2">No active campaigns right now</h3>
          <p className="text-sm text-cultr-textMuted max-w-md mx-auto">
            Check back soon or contact your creator manager for upcoming opportunities.
          </p>
        </div>
      )}

      {/* Active */}
      {activeCampaigns.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-4 h-4 text-cultr-forest" />
            <h2 className="text-lg font-display font-bold text-cultr-forest">Active Campaigns</h2>
            <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5">
              {activeCampaigns.length}
            </span>
          </div>
          <div className="space-y-3">
            {activeCampaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcomingCampaigns.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-cultr-textMuted" />
            <h2 className="text-lg font-display font-bold text-cultr-forest">Upcoming</h2>
          </div>
          <div className="space-y-3">
            {upcomingCampaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        </section>
      )}

      {/* Past Campaigns (collapsed by default) */}
      {endedCampaigns.length > 0 && (
        <section>
          <button
            onClick={() => setShowPast(!showPast)}
            className="flex items-center gap-2 text-sm text-cultr-textMuted hover:text-cultr-forest transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showPast ? 'rotate-0' : '-rotate-90'}`} />
            <span className="font-medium">Past Campaigns ({endedCampaigns.length})</span>
          </button>
          {showPast && (
            <div className="space-y-3 mt-4">
              {endedCampaigns.map((c) => (
                <CampaignCard key={c.id} campaign={c} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* CTA */}
      <div className="grad-mint border border-cultr-sage rounded-2xl p-6 text-center">
        <p className="font-display font-bold text-cultr-forest mb-2">
          Have a campaign idea?
        </p>
        <p className="text-sm text-cultr-textMuted mb-4">
          Share your ideas for promotions, collaborations, or content themes with your creator manager.
        </p>
        <a
          href="mailto:creators@cultrhealth.com"
          className="inline-flex items-center gap-2 px-5 py-2.5 grad-dark text-white rounded-lg text-sm font-medium hover:bg-cultr-forestDark transition-colors"
        >
          Contact Creator Support
        </a>
      </div>
    </div>
  )
}
