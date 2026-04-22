'use client'

import { useMemo } from 'react'
import { Sparkles } from 'lucide-react'
import {
  THERAPY_CATEGORIES,
  THERAPY_PRESETS,
  type TherapyCategory,
  type TherapyPreset,
} from '@/lib/config/calculator-presets'
import { cn } from '@/lib/utils'

type Props = {
  selectedPresetId: string | null
  activeCategory: TherapyCategory | null
  onCategoryChange: (category: TherapyCategory | null) => void
  onPresetChange: (preset: TherapyPreset | null) => void
}

export function TherapyPresetPicker({
  selectedPresetId,
  activeCategory,
  onCategoryChange,
  onPresetChange,
}: Props) {
  const presetsInCategory = useMemo(() => {
    if (!activeCategory || activeCategory === 'custom') return []
    return THERAPY_PRESETS.filter((p) => p.category === activeCategory)
  }, [activeCategory])

  const selectedPreset = useMemo(
    () => THERAPY_PRESETS.find((p) => p.id === selectedPresetId) ?? null,
    [selectedPresetId]
  )

  return (
    <div className="grad-light border border-cultr-sage rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="w-5 h-5 text-cultr-forest" aria-hidden="true" />
        <h3 className="font-display font-bold text-cultr-text">CULTR Therapy Presets</h3>
      </div>

      <p className="mb-4 text-xs text-cultr-textMuted">
        Pick a CULTR therapy to pre-fill reference values, then fine-tune. Always verify with your provider.
      </p>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Therapy category">
        {THERAPY_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                onCategoryChange(cat.id)
                if (cat.id === 'custom') {
                  onPresetChange(null)
                }
              }}
              className={cn(
                'px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium transition-all',
                isActive
                  ? 'bg-cultr-forest text-white shadow-sm'
                  : 'bg-white border border-cultr-sage text-cultr-text hover:border-cultr-forest/50'
              )}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Therapy chips (appear after category picked) */}
      {activeCategory && activeCategory !== 'custom' && presetsInCategory.length > 0 && (
        <div className="mt-5 pt-5 border-t border-cultr-sage/40">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-cultr-textMuted">
            Select therapy
          </p>
          <div className="flex flex-wrap gap-2">
            {presetsInCategory.map((preset) => {
              const isActive = selectedPresetId === preset.id
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onPresetChange(preset)}
                  title={preset.summary}
                  className={cn(
                    'group relative px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium transition-all border-l-4',
                    isActive
                      ? 'bg-cultr-mint text-cultr-forest border-l-cultr-forest shadow-sm'
                      : 'bg-white text-cultr-text border-l-transparent border border-cultr-sage hover:border-cultr-forest/50'
                  )}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Selected preset summary */}
      {selectedPreset && (
        <div className="mt-5 rounded-xl bg-white border border-cultr-sage/60 px-4 py-3">
          <p className="text-xs font-semibold text-cultr-forest">{selectedPreset.compound}</p>
          <p className="mt-1 text-xs text-cultr-textMuted leading-relaxed">{selectedPreset.summary}</p>
        </div>
      )}

      {activeCategory === 'custom' && (
        <div className="mt-5 rounded-xl bg-cultr-mint/60 border border-cultr-sage px-4 py-3">
          <p className="text-xs text-cultr-text leading-relaxed">
            Enter vial, water, and dose values manually below.
          </p>
        </div>
      )}
    </div>
  )
}
