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
          className="flex-shrink-0 p-2 rounded-lg bg-cultr-forest text-white hover:bg-cultr-forestDark transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

export default function ShareEarnPage() {
  const { links, codes, refreshLinks, loading } = useCreator()
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [newSlug, setNewSlug] = useState('')
  const [newDest, setNewDest] = useState('/')
  const [creating, setCreating] = useState(false)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://cultrhealth.com'

  const handleCreateLink = async () => {
    if (!newSlug.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/creators/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: newSlug.trim(), destination_path: newDest }),
      })
      if (res.ok) {
        await refreshLinks()
        setShowLinkForm(false)
        setNewSlug('')
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
          <div className="bg-cultr-mint border border-cultr-sage rounded-xl p-4 mb-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-cultr-forest mb-1">Slug</label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-cultr-textMuted">{baseUrl}/r/</span>
                <input
                  type="text"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                  placeholder="my-link"
                  className="flex-1 bg-white border border-cultr-sage rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cultr-forest/20"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-cultr-forest mb-1">Destination</label>
              <select
                value={newDest}
                onChange={(e) => setNewDest(e.target.value)}
                className="w-full bg-white border border-cultr-sage rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cultr-forest/20"
              >
                {LINK_DESTINATIONS.map((d) => (
                  <option key={d.path} value={d.path}>{d.label} ({d.path})</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateLink}
                disabled={creating || !newSlug.trim()}
                className="px-4 py-2 bg-cultr-forest text-white rounded-lg text-sm font-medium hover:bg-cultr-forestDark transition-colors disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Link'}
              </button>
              <button
                onClick={() => setShowLinkForm(false)}
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
