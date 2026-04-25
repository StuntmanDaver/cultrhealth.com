'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Scale } from 'lucide-react'
import {
  deriveDoseFromWeight,
  type DoseUnit,
  type DosePerKgUnit,
  type WeightUnit,
} from '@/lib/peptide-calculator'
import { cn } from '@/lib/utils'

type Props = {
  initialWeight?: number | null
  initialWeightUnit?: WeightUnit
  initialDosePerKg?: number | null
  initialDosePerKgUnit?: DosePerKgUnit
  onApply: (args: {
    dose: number
    doseUnit: DoseUnit
    weight: number
    weightUnit: WeightUnit
    dosePerKg: number
    dosePerKgUnit: DosePerKgUnit
  }) => void
}

export function WeightBasedDoseCard({
  initialWeight = null,
  initialWeightUnit = 'lb',
  initialDosePerKg = null,
  initialDosePerKgUnit = 'mcg/kg',
  onApply,
}: Props) {
  const [open, setOpen] = useState<boolean>(Boolean(initialWeight && initialDosePerKg))
  const [weight, setWeight] = useState<string>(initialWeight ? String(initialWeight) : '')
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(initialWeightUnit)
  const [dosePerKg, setDosePerKg] = useState<string>(initialDosePerKg ? String(initialDosePerKg) : '')
  const [dosePerKgUnit, setDosePerKgUnit] = useState<DosePerKgUnit>(initialDosePerKgUnit)

  const preview = useMemo(() => {
    const w = parseFloat(weight)
    const d = parseFloat(dosePerKg)
    if (!(w > 0) || !(d > 0)) return null
    const result = deriveDoseFromWeight({ weight: w, weightUnit, dosePerKg: d, dosePerKgUnit })
    if (!result) return null
    return {
      ...result,
      display: result.doseUnit === 'mcg' ? `${Math.round(result.dose)} mcg` : `${result.dose.toFixed(3)} mg`,
      weightDisplay: weightUnit === 'lb' ? `${w.toFixed(0)} lb (${result.weightKg.toFixed(1)} kg)` : `${w.toFixed(1)} kg`,
    }
  }, [weight, weightUnit, dosePerKg, dosePerKgUnit])

  const canApply = preview != null

  const handleApply = () => {
    if (!preview) return
    const w = parseFloat(weight)
    const d = parseFloat(dosePerKg)
    onApply({
      dose: preview.dose,
      doseUnit: preview.doseUnit,
      weight: w,
      weightUnit,
      dosePerKg: d,
      dosePerKgUnit,
    })
  }

  return (
    <div className="rounded-2xl border border-cultr-sage grad-light">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-2xl p-6 text-left"
      >
        <div className="flex items-center gap-3">
          <Scale className="h-5 w-5 text-cultr-forest" aria-hidden="true" />
          <div>
            <h3 className="font-display font-bold text-cultr-text">Advanced — dose by body weight</h3>
            <p className="text-xs text-cultr-textMuted">For peptides dosed at a per-kg target.</p>
          </div>
        </div>
        <ChevronDown
          className={cn('h-5 w-5 text-cultr-forest transition-transform', open ? 'rotate-180' : 'rotate-0')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="space-y-5 border-t border-cultr-sage/40 p-6">
          {/* Weight row */}
          <div>
            <label htmlFor="wbd-weight" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-cultr-textMuted">
              Body weight
            </label>
            <div className="flex gap-2">
              <input
                id="wbd-weight"
                type="number"
                inputMode="decimal"
                value={weight}
                placeholder={weightUnit === 'lb' ? '180' : '82'}
                onChange={(e) => setWeight(e.target.value)}
                className="flex-1 rounded-lg border border-cultr-sage bg-white px-4 py-3 text-cultr-text outline-none transition-all focus:border-cultr-forest focus:ring-1 focus:ring-cultr-forest/50"
              />
              <div className="flex rounded-lg border border-cultr-sage bg-white">
                {(['lb', 'kg'] as WeightUnit[]).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setWeightUnit(u)}
                    className={cn(
                      'px-3 py-2.5 min-h-[44px] min-w-[44px] text-sm font-medium transition-colors',
                      weightUnit === u
                        ? 'bg-cultr-forest text-white'
                        : 'text-cultr-text hover:bg-cultr-mint/40'
                    )}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dose-per-kg row */}
          <div>
            <label htmlFor="wbd-dose-per-kg" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-cultr-textMuted">
              Target dose per kg
            </label>
            <div className="flex gap-2">
              <input
                id="wbd-dose-per-kg"
                type="number"
                inputMode="decimal"
                value={dosePerKg}
                placeholder={dosePerKgUnit === 'mcg/kg' ? '10' : '0.05'}
                step="0.01"
                onChange={(e) => setDosePerKg(e.target.value)}
                className="flex-1 rounded-lg border border-cultr-sage bg-white px-4 py-3 text-cultr-text outline-none transition-all focus:border-cultr-forest focus:ring-1 focus:ring-cultr-forest/50"
              />
              <div className="flex rounded-lg border border-cultr-sage bg-white">
                {(['mcg/kg', 'mg/kg'] as DosePerKgUnit[]).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setDosePerKgUnit(u)}
                    className={cn(
                      'px-3 py-2.5 min-h-[44px] min-w-[44px] text-sm font-medium transition-colors',
                      dosePerKgUnit === u
                        ? 'bg-cultr-forest text-white'
                        : 'text-cultr-text hover:bg-cultr-mint/40'
                    )}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-xl border border-cultr-sage/60 bg-white p-4">
            {preview ? (
              <p className="text-sm text-cultr-text">
                <span className="text-cultr-textMuted">{preview.weightDisplay}</span> ×{' '}
                <span className="text-cultr-textMuted">
                  {dosePerKg} {dosePerKgUnit}
                </span>{' '}
                = <strong className="text-cultr-forest">{preview.display} dose</strong>
              </p>
            ) : (
              <p className="text-sm text-cultr-textMuted">Enter weight and dose-per-kg to preview.</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleApply}
            disabled={!canApply}
            className={cn(
              'w-full rounded-full px-6 py-3 text-sm font-semibold transition-colors',
              canApply
                ? 'bg-cultr-forest text-white hover:bg-cultr-forest/90'
                : 'bg-cultr-sage/50 text-cultr-textMuted cursor-not-allowed'
            )}
          >
            Apply to dose
          </button>
        </div>
      )}
    </div>
  )
}
