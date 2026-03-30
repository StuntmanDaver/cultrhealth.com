'use client'

import { useState, useEffect } from 'react'
import { Layers, AlertTriangle } from 'lucide-react'

export default function StackingGuidesClient() {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/portal/stacking-content')
      .then(async (res) => {
        if (cancelled || !res.ok) return
        const data = await res.json()
        if (!cancelled && data.html) setContent(data.html)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-cultr-mint flex items-center justify-center">
            <Layers className="w-5 h-5 text-cultr-forest" />
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-cultr-forest">
            Stacking Guides
          </h1>
        </div>
        <p className="text-sm text-cultr-textMuted ml-[52px]">
          Goal-based peptide stacking protocols for fat loss, recovery, growth, and longevity.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 animate-pulse">
          <div className="h-6 bg-stone-100 rounded w-1/3 mb-4" />
          <div className="h-4 bg-stone-100 rounded w-2/3 mb-3" />
          <div className="h-4 bg-stone-100 rounded w-1/2 mb-3" />
          <div className="h-4 bg-stone-100 rounded w-3/4" />
        </div>
      )}

      {/* Content */}
      {!loading && content && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 md:p-8 shadow-sm">
          <div
            dangerouslySetInnerHTML={{ __html: content }}
            className="
              library-content prose prose-lg max-w-none
              [&_h1]:text-2xl [&_h1]:font-display [&_h1]:text-cultr-forest [&_h1]:mb-5 [&_h1]:mt-10 first:[&_h1]:mt-0
              [&_h2]:text-xl [&_h2]:font-display [&_h2]:text-cultr-forest [&_h2]:mb-4 [&_h2]:mt-8 [&_h2]:border-b [&_h2]:border-stone-200 [&_h2]:pb-2
              [&_h3]:text-lg [&_h3]:font-display [&_h3]:text-cultr-forestLight [&_h3]:mb-3 [&_h3]:mt-6
              [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-cultr-text [&_h4]:mb-2 [&_h4]:mt-5
              [&_h5]:text-sm [&_h5]:font-semibold [&_h5]:text-cultr-text [&_h5]:mb-2 [&_h5]:mt-4
              [&_p]:text-cultr-textMuted [&_p]:leading-relaxed [&_p]:mb-4 [&_p]:text-sm
              [&_ul]:mb-4 [&_ul]:space-y-1 [&_ul]:list-disc [&_ul]:pl-5
              [&_li]:text-cultr-textMuted [&_li]:text-sm
              [&_ol]:mb-4 [&_ol]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5
              [&_table]:w-full [&_table]:border-collapse [&_table]:mb-6 [&_table]:text-sm
              [&_thead]:bg-cultr-mint/50
              [&_th]:text-left [&_th]:p-3 [&_th]:text-cultr-forest [&_th]:font-medium [&_th]:border-b [&_th]:border-stone-200
              [&_td]:p-3 [&_td]:border-b [&_td]:border-stone-100 [&_td]:text-cultr-textMuted
              [&_tr:hover]:bg-cultr-mint/20
              [&_blockquote]:border-l-4 [&_blockquote]:border-cultr-forest [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-cultr-textMuted [&_blockquote]:my-6
              [&_hr]:border-stone-200 [&_hr]:my-10
              [&_strong]:text-cultr-text [&_strong]:font-semibold
              [&_code]:bg-cultr-mint [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-cultr-forest [&_code]:text-xs
              [&_a]:text-cultr-forest [&_a]:underline [&_a]:hover:text-cultr-forestLight
            "
          />
        </div>
      )}

      {/* Empty */}
      {!loading && !content && (
        <div className="text-center py-12">
          <Layers className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-cultr-textMuted">Stacking guides are not available right now.</p>
        </div>
      )}

      {/* Disclaimer */}
      {!loading && content && (
        <div className="mt-8 p-5 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 font-medium text-sm mb-1">Research Use Only</p>
              <p className="text-amber-700/80 text-xs leading-relaxed">
                This information is for educational and research purposes only.
                Always consult with a qualified healthcare provider before considering any peptide therapy.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
