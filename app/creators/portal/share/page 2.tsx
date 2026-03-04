'use client'

import { useState } from 'react'
import { useCreator } from '@/lib/contexts/CreatorContext'
import {
  Copy,
  Check,
  Plus,
  Link2,
  Tag,
  Shield,
  Globe,
  Instagram,
  Twitter,
  Facebook,
  Share2,
} from 'lucide-react'
import { LINK_DESTINATIONS, FTC_DISCLOSURES } from '@/lib/config/affiliate'

function CopyableLink({ label, value, stats }: { label: string; value: string; stats?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-wider text-cultr-textMuted font-medium">
          {label}
        </p>
        {stats && (
          <span className="text-xs text-cultr-textMuted">{stats}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-sm text-cultr-forest bg-stone-50 px-3 py-2 rounded-lg truncate font-mono">
          {value}
        </code>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 p-2 rounded-lg grad-dark text-white hover:bg-cultr-forestDark transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

/* ─── Pre-built social post templates ─── */
const SOCIAL_POSTS = [
  {
    platform: 'Instagram',
    icon: Instagram,
    posts: [
      {
        label: 'Lab Results Post',
        text: `Just got my comprehensive lab panel back from @cultrhealth 🧪

28–59 biomarkers tested. Turns out my regular doctor was only checking 5.

This is why "you're fine" isn't enough.

Working with a licensed provider on a personalized protocol. Link in bio 👆

Use code {CODE} for a discount.

#ad #cultrhealth #healthoptimization #labwork`,
      },
      {
        label: 'Progress Update',
        text: `The same protocols celebrities pay $10K/year for — now from $199/mo.

Licensed providers. Personalized peptide protocols. 28–59 biomarker testing (SiPho Health).

Not a supplement company. An actual medical practice.

Take the quiz → {LINK}

#partner @cultrhealth`,
      },
    ],
  },
  {
    platform: 'Twitter / X',
    icon: Twitter,
    posts: [
      {
        label: 'Quick Hit',
        text: `My doctor: "Your labs are normal"
CULTR: "Here are 3 things that explain why you feel off"

28–59 biomarkers > the basic 5.

{LINK}

#ad @cultrhealth`,
      },
      {
        label: 'Science Angle',
        text: `Peptides are not steroids.

They're short amino acid chains that signal your body to do what it already knows how to do — just better.

Provider-supervised. Licensed pharmacy. Real science.

{LINK} #ad`,
      },
    ],
  },
  {
    platform: 'Facebook',
    icon: Facebook,
    posts: [
      {
        label: 'Personal Story',
        text: `I've been working with CULTR Health for the past few months and wanted to share my experience.

They test 28–59 biomarkers (not the basic 5 your doctor runs) and match you with a licensed provider who builds a personalized protocol.

Plans start at $199/mo — less than most gym memberships.

If you've ever felt like something's off but your doctor says "you're fine," this is worth looking into.

Take the quiz: {LINK}
Use code {CODE} for a discount.

Paid partnership with CULTR Health.`,
      },
    ],
  },
]

function SocialShareCard({
  platform,
  icon: Icon,
  posts,
  defaultLink,
  defaultCode,
}: {
  platform: string
  icon: React.ElementType
  posts: { label: string; text: string }[]
  defaultLink: string
  defaultCode: string
}) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const personalize = (text: string) =>
    text.replace(/\{LINK\}/g, defaultLink).replace(/\{CODE\}/g, defaultCode)

  const handleCopy = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(personalize(text))
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  return (
    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 bg-stone-50 border-b border-stone-200">
        <Icon className="w-4 h-4 text-cultr-forest" />
        <span className="text-sm font-display font-bold text-cultr-forest">{platform}</span>
      </div>
      <div className="divide-y divide-stone-100">
        {posts.map((post, idx) => (
          <div key={idx} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-cultr-textMuted">{post.label}</span>
              <button
                onClick={() => handleCopy(post.text, idx)}
                className="flex items-center gap-1 text-xs font-medium text-cultr-forest hover:underline"
              >
                {copiedIdx === idx ? (
                  <><Check className="w-3 h-3" /> Copied</>
                ) : (
                  <><Copy className="w-3 h-3" /> Copy</>
                )}
              </button>
            </div>
            <pre className="text-xs text-cultr-text whitespace-pre-wrap leading-relaxed font-body bg-stone-50 rounded-lg p-3">
              {personalize(post.text)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ShareEarnPage() {
  const { links, codes, refreshLinks, loading } = useCreator()
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [newSlug, setNewSlug] = useState('')
  const [newDest, setNewDest] = useState('/')
  const [useCustomUrl, setUseCustomUrl] = useState(false)
  const [customUrl, setCustomUrl] = useState('')
  const [creating, setCreating] = useState(false)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://cultrhealth.com'

  const effectiveDest = useCustomUrl ? customUrl : newDest

  const handleCreateLink = async () => {
    if (!newSlug.trim()) return
    if (useCustomUrl && !customUrl.startsWith('/')) return
    setCreating(true)
    try {
      const res = await fetch('/api/creators/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: newSlug.trim(), destination_path: effectiveDest }),
      })
      if (res.ok) {
        await refreshLinks()
        setShowLinkForm(false)
        setNewSlug('')
        setCustomUrl('')
        setUseCustomUrl(false)
      }
    } catch (err) {
      console.error('Link creation failed:', err)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl animate-pulse">
        <div className="h-8 w-40 bg-stone-100 rounded" />
        <div className="h-24 bg-stone-100 rounded-2xl" />
        <div className="h-24 bg-stone-100 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-cultr-forest">
          Share & Earn
        </h1>
        <p className="text-sm text-cultr-textMuted mt-1">
          Share your tracking links and coupon codes to earn commissions.
        </p>
      </div>

      {/* Tracking Links */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-bold text-cultr-forest flex items-center gap-2">
            <Link2 className="w-5 h-5" /> Tracking Links
          </h2>
          <button
            onClick={() => setShowLinkForm(!showLinkForm)}
            className="flex items-center gap-1 text-sm text-cultr-forest font-medium hover:underline"
          >
            <Plus className="w-4 h-4" /> New Link
          </button>
        </div>

        {showLinkForm && (
          <div className="grad-mint border border-cultr-sage rounded-xl p-4 mb-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-cultr-forest mb-1">Slug</label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-cultr-textMuted">{baseUrl}/r/</span>
                <input
                  type="text"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                  placeholder="my-link"
                  className="flex-1 grad-white border border-cultr-sage rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cultr-forest/20"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-cultr-forest">Destination</label>
                <button
                  type="button"
                  onClick={() => setUseCustomUrl(!useCustomUrl)}
                  className="flex items-center gap-1 text-xs text-cultr-forest font-medium hover:underline"
                >
                  <Globe className="w-3 h-3" />
                  {useCustomUrl ? 'Use preset page' : 'Link to any page'}
                </button>
              </div>
              {useCustomUrl ? (
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-cultr-textMuted">{baseUrl}</span>
                    <input
                      type="text"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value.startsWith('/') ? e.target.value : '/' + e.target.value)}
                      placeholder="/products/glp-1"
                      className="flex-1 grad-white border border-cultr-sage rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cultr-forest/20"
                    />
                  </div>
                  <p className="text-[11px] text-cultr-textMuted mt-1">
                    Enter any path on cultrhealth.com — product pages, blog posts, science articles, etc.
                  </p>
                </div>
              ) : (
                <select
                  value={newDest}
                  onChange={(e) => setNewDest(e.target.value)}
                  className="w-full bg-white border border-cultr-sage rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cultr-forest/20"
                >
                  {LINK_DESTINATIONS.map((d) => (
                    <option key={d.path} value={d.path}>{d.label} ({d.path})</option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateLink}
                disabled={creating || !newSlug.trim() || (useCustomUrl && !customUrl.startsWith('/'))}
                className="px-4 py-2 grad-dark text-white rounded-lg text-sm font-medium hover:bg-cultr-forestDark transition-colors disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Link'}
              </button>
              <button
                onClick={() => { setShowLinkForm(false); setUseCustomUrl(false); setCustomUrl('') }}
                className="px-4 py-2 text-cultr-textMuted text-sm hover:text-cultr-forest"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {links.length > 0 ? (
            links.map((link) => (
              <CopyableLink
                key={link.id}
                label={link.is_default ? 'Default Link' : link.slug}
                value={`${baseUrl}/r/${link.slug}`}
                stats={`${link.click_count} clicks | ${link.conversion_count} conversions`}
              />
            ))
          ) : (
            <div className="bg-white border border-stone-200 rounded-xl p-8 text-center">
              <Link2 className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <p className="text-cultr-textMuted text-sm">No tracking links yet. Create your first one above.</p>
            </div>
          )}
        </div>
      </section>

      {/* Coupon Codes */}
      <section>
        <h2 className="text-lg font-display font-bold text-cultr-forest flex items-center gap-2 mb-4">
          <Tag className="w-5 h-5" /> Coupon Codes
        </h2>

        <div className="space-y-3">
          {codes.length > 0 ? (
            codes.map((code) => (
              <CopyableLink
                key={code.id}
                label={code.is_primary ? 'Primary Code' : 'Code'}
                value={code.code}
                stats={`${code.use_count} uses | $${Number(code.total_revenue).toFixed(2)} revenue`}
              />
            ))
          ) : (
            <div className="bg-white border border-stone-200 rounded-xl p-8 text-center">
              <Tag className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <p className="text-cultr-textMuted text-sm">Coupon codes are assigned by admin upon approval.</p>
            </div>
          )}
        </div>
      </section>

      {/* Pre-Built Social Posts */}
      <section>
        <h2 className="text-lg font-display font-bold text-cultr-forest flex items-center gap-2 mb-4">
          <Share2 className="w-5 h-5" /> Ready-to-Post Content
        </h2>
        <p className="text-sm text-cultr-textMuted mb-4">
          Pre-written posts with your tracking link and code auto-inserted. Copy, paste, and customize.
        </p>
        <div className="space-y-4">
          {SOCIAL_POSTS.map((platform) => (
            <SocialShareCard
              key={platform.platform}
              {...platform}
              defaultLink={links.length > 0 ? `${baseUrl}/r/${links[0].slug}` : `${baseUrl}/r/your-link`}
              defaultCode={codes.length > 0 ? codes[0].code : 'YOURCODE'}
            />
          ))}
        </div>
      </section>

      {/* FTC Disclosures */}
      <section>
        <h2 className="text-lg font-display font-bold text-cultr-forest flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5" /> FTC Disclosure Templates
        </h2>
        <div className="space-y-3">
          {FTC_DISCLOSURES.map((d) => (
            <CopyableLink key={d.id} label={d.label} value={d.text} />
          ))}
        </div>
      </section>
    </div>
  )
}
