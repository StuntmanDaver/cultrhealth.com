'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Droplets, FlaskConical, Syringe } from 'lucide-react'
import {
  calcPeptide,
  formatNumber,
  type DosageFrequency,
  type DoseUnit,
  type DosePerKgUnit,
  type WeightUnit,
} from '@/lib/peptide-calculator'
import {
  decodeUrlState,
  encodeUrlState,
} from '@/lib/dosing-calculator/url-state'
import {
  THERAPY_PRESETS,
  type TherapyCategory,
  type TherapyPreset,
} from '@/lib/config/calculator-presets'
import { cn } from '@/lib/utils'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { TherapyPresetPicker } from './TherapyPresetPicker'
import { CapacityWarningBanner } from './CapacityWarningBanner'
import { SyringeMeter } from './SyringeMeter'
import { WeightBasedDoseCard } from './WeightBasedDoseCard'
import { TherapyPlanCard } from './TherapyPlanCard'
import { InstructionCard } from './InstructionCard'

export type DosingCalculatorVariant = 'public' | 'members' | 'creators'

interface DosingCalculatorProps {
  variant: DosingCalculatorVariant
  email?: string
  backHref?: string
  /** Slot rendered between the header and the calculator body — used by the
   * members/creators surfaces to mount the AI dosing engine panel. */
  afterHeader?: React.ReactNode
  /** Pre-load a therapy preset on mount. Used by /tools/dosing-calculator/[slug]
   * static pages so the URL stays canonical (no `?preset=` query). Takes priority
   * over any `?preset=` search param. */
  initialPresetId?: string
}

const VIAL_OPTIONS = [5, 10, 15, 50, 100] as const
const WATER_OPTIONS = [1, 2, 3, 5] as const
const SYRINGE_OPTIONS = [0.3, 0.5, 1.0] as const
const DOSE_PRESETS_MCG = [100, 250, 500, 1000] as const
const DOSE_PRESETS_MG = [0.25, 0.5, 1.0, 2.5, 5, 10] as const

type VariantChrome = { backHref: string; backLabel: string }

function chromeFor(variant: DosingCalculatorVariant, backHref?: string): VariantChrome {
  if (variant === 'members') {
    return { backHref: backHref ?? '/members', backLabel: 'Back to Members' }
  }
  if (variant === 'creators') {
    return { backHref: backHref ?? '/creators/portal/dashboard', backLabel: 'Back to Portal' }
  }
  return { backHref: backHref ?? '/tools', backLabel: 'Back to Tools' }
}

export function DosingCalculator({ variant, backHref, afterHeader, initialPresetId }: DosingCalculatorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const chrome = chromeFor(variant, backHref)

  // ── Hydrate initial state from URL search params ─────────────────────
  const initialUrl = useMemo(() => {
    const params = typeof searchParams === 'object' && searchParams
      ? new URLSearchParams(searchParams.toString())
      : new URLSearchParams()
    return decodeUrlState(params)
  }, [searchParams])

  // Per-preset static pages pass a prop instead of `?preset=`. Prop wins so
  // the URL stays canonical (`/tools/dosing-calculator/bpc-157` not `?preset=`).
  const resolvedPresetId = initialPresetId ?? initialUrl.presetId
  const initialPreset = resolvedPresetId
    ? THERAPY_PRESETS.find((p) => p.id === resolvedPresetId) ?? null
    : null

  // ── Core input state ────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState<TherapyCategory | null>(
    initialPreset?.category ?? (initialUrl.vialMg ? 'custom' : null)
  )
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(
    initialPreset?.id ?? null
  )

  const [vialMg, setVialMg] = useState<number>(initialUrl.vialMg ?? initialPreset?.vialMg ?? 5)
  const [waterMl, setWaterMl] = useState<number>(initialUrl.waterMl ?? initialPreset?.waterMl ?? 2)
  const [dose, setDose] = useState<number>(initialUrl.dose ?? initialPreset?.dose ?? 250)
  const [doseUnit, setDoseUnit] = useState<DoseUnit>(
    initialUrl.doseUnit ?? initialPreset?.doseUnit ?? 'mcg'
  )
  const [syringeMl, setSyringeMl] = useState<number>(
    initialUrl.syringeMl ?? initialPreset?.syringeMl ?? 1.0
  )

  const [frequency, setFrequency] = useState<DosageFrequency | null>(
    initialUrl.frequency ?? initialPreset?.frequency ?? null
  )
  const [therapyLengthWeeks, setTherapyLengthWeeks] = useState<number | null>(
    initialUrl.therapyLengthWeeks ?? initialPreset?.therapyLengthWeeks ?? null
  )

  const [weight, setWeight] = useState<number | null>(initialUrl.weight ?? null)
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(initialUrl.weightUnit ?? 'lb')
  const [dosePerKg, setDosePerKg] = useState<number | null>(null)
  const [dosePerKgUnit, setDosePerKgUnit] = useState<DosePerKgUnit>('mcg/kg')

  // ── Preset application ──────────────────────────────────────────────
  const applyPreset = useCallback((preset: TherapyPreset | null) => {
    setSelectedPresetId(preset?.id ?? null)
    if (!preset) return
    setActiveCategory(preset.category)
    setVialMg(preset.vialMg)
    setWaterMl(preset.waterMl)
    setDose(preset.dose)
    setDoseUnit(preset.doseUnit)
    setFrequency(preset.frequency)
    setTherapyLengthWeeks(preset.therapyLengthWeeks)
    if (preset.syringeMl) setSyringeMl(preset.syringeMl)
    if (preset.dosePerKg) setDosePerKg(preset.dosePerKg)
    if (preset.dosePerKgUnit) setDosePerKgUnit(preset.dosePerKgUnit)
  }, [])

  const handleCategoryChange = useCallback((category: TherapyCategory | null) => {
    setActiveCategory(category)
    if (category === 'custom') {
      setSelectedPresetId(null)
    }
  }, [])

  // ── Weight-based apply ──────────────────────────────────────────────
  const handleWeightApply = useCallback(
    (args: {
      dose: number
      doseUnit: DoseUnit
      weight: number
      weightUnit: WeightUnit
      dosePerKg: number
      dosePerKgUnit: DosePerKgUnit
    }) => {
      setDose(args.doseUnit === 'mcg' ? Math.round(args.dose) : Number(args.dose.toFixed(4)))
      setDoseUnit(args.doseUnit)
      setWeight(args.weight)
      setWeightUnit(args.weightUnit)
      setDosePerKg(args.dosePerKg)
      setDosePerKgUnit(args.dosePerKgUnit)
    },
    []
  )

  // ── Math ────────────────────────────────────────────────────────────
  const result = useMemo(
    () =>
      calcPeptide({
        vialMg,
        waterMl,
        dose,
        doseUnit,
        syringeMl: syringeMl > 0 ? syringeMl : undefined,
        frequency: frequency ?? undefined,
        therapyLengthWeeks: therapyLengthWeeks ?? undefined,
      }),
    [vialMg, waterMl, dose, doseUnit, syringeMl, frequency, therapyLengthWeeks]
  )

  // ── URL persistence (debounced) ─────────────────────────────────────
  const debouncedUrlTimer = useRef<number | null>(null)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (debouncedUrlTimer.current) window.clearTimeout(debouncedUrlTimer.current)
    debouncedUrlTimer.current = window.setTimeout(() => {
      const next = encodeUrlState({
        presetId: selectedPresetId,
        vialMg,
        waterMl,
        dose,
        doseUnit,
        syringeMl,
        weight: weight ?? undefined,
        weightUnit,
        frequency: frequency ?? undefined,
        therapyLengthWeeks: therapyLengthWeeks ?? undefined,
      })
      const nextQs = next.toString()
      const currentQs = searchParams?.toString() ?? ''
      if (nextQs === currentQs) return
      const url = nextQs ? `?${nextQs}` : window.location.pathname
      router.replace(url, { scroll: false })
    }, 250)
    return () => {
      if (debouncedUrlTimer.current) window.clearTimeout(debouncedUrlTimer.current)
    }
  }, [
    selectedPresetId,
    vialMg,
    waterMl,
    dose,
    doseUnit,
    syringeMl,
    weight,
    weightUnit,
    frequency,
    therapyLengthWeeks,
    router,
    searchParams,
  ])

  const selectedPreset = selectedPresetId
    ? THERAPY_PRESETS.find((p) => p.id === selectedPresetId) ?? null
    : null

  return (
    <div className="min-h-screen grad-white">
      {/* Header */}
      <section className="py-12 px-6 grad-dark text-white">
        <div className="max-w-4xl mx-auto">
          <Link
            href={chrome.backHref}
            className="inline-flex items-center gap-2 -mx-2 -my-2 px-2 py-2 min-h-[44px] text-white/70 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {chrome.backLabel}
          </Link>
          <div>
            <Image
              src="/cultr-health-logo.png"
              alt="CULTR Health"
              width={200}
              height={67}
              className="brightness-0 invert mb-2"
              priority
            />
            <p className="text-white/70">Peptide reconstitution & dosing calculator</p>
          </div>
        </div>
      </section>

      {afterHeader}

      <section className="py-10 px-6 section-veil">
        <div className="max-w-5xl mx-auto space-y-8">
          <ScrollReveal direction="up" duration={500}>
            <TherapyPresetPicker
              selectedPresetId={selectedPresetId}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
              onPresetChange={applyPreset}
            />
          </ScrollReveal>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Inputs — DOM order keeps screen readers + keyboard nav linear,
                visual order on mobile puts the result FIRST so users can see
                the meter react as they edit. */}
            <div className="space-y-6 order-2 lg:order-1">
              {/* Vial */}
              <div className="grad-light border border-cultr-sage rounded-2xl p-6">
                <HeadingRow icon={<FlaskConical className="w-5 h-5 text-cultr-forest" />} title="Vial Amount" />
                <PillRow
                  values={VIAL_OPTIONS}
                  selected={vialMg}
                  onSelect={setVialMg}
                  unit=" mg"
                />
                <CustomNumberInput
                  placeholder="mg"
                  value={vialMg}
                  onChange={setVialMg}
                  min={0.01}
                  max={10000}
                />
                <p className="mt-3 text-xs text-cultr-textMuted">Total peptide content in your vial.</p>
                <div className="mt-3 flex items-start gap-2 bg-cultr-mint/60 border border-cultr-sage rounded-xl px-4 py-3">
                  <span className="text-sm leading-none mt-0.5">💡</span>
                  <div className="text-xs text-cultr-text">
                    <span className="font-semibold">Blend tip:</span> Add the mg values together.{' '}
                    <span className="text-cultr-textMuted">e.g. 12 mg + 6 mg = <strong>18 mg</strong> total</span>
                  </div>
                </div>
              </div>

              {/* Water */}
              <div className="grad-light border border-cultr-sage rounded-2xl p-6">
                <HeadingRow icon={<Droplets className="w-5 h-5 text-cultr-forest" />} title="Bacteriostatic Water" />
                <PillRow
                  values={WATER_OPTIONS}
                  selected={waterMl}
                  onSelect={setWaterMl}
                  unit=" mL"
                />
                <CustomNumberInput
                  placeholder="mL"
                  value={waterMl}
                  onChange={setWaterMl}
                  step="0.1"
                  min={0.01}
                  max={100}
                />
                <p className="mt-3 text-xs text-cultr-textMuted">Amount of diluent added to reconstitute.</p>
              </div>

              {/* Dose */}
              <div className="grad-light border border-cultr-sage rounded-2xl p-6">
                <HeadingRow icon={<Syringe className="w-5 h-5 text-cultr-forest" />} title="Desired Dose" />
                <div className="mb-4 flex gap-2">
                  {(['mcg', 'mg'] as DoseUnit[]).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => {
                        setDoseUnit(unit)
                        setDose(unit === 'mcg' ? 250 : 0.25)
                      }}
                      className={cn(
                        'px-4 py-2.5 min-h-[44px] min-w-[44px] rounded-full text-sm font-medium transition-all',
                        doseUnit === unit
                          ? 'bg-cultr-forest text-white'
                          : 'bg-white border border-cultr-sage text-cultr-text hover:border-cultr-forest/50'
                      )}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
                <PillRow
                  values={doseUnit === 'mcg' ? DOSE_PRESETS_MCG : DOSE_PRESETS_MG}
                  selected={dose}
                  onSelect={setDose}
                  unit={doseUnit === 'mcg' ? ' mcg' : ' mg'}
                />
                <CustomNumberInput
                  placeholder={doseUnit}
                  value={dose}
                  onChange={setDose}
                  step={doseUnit === 'mcg' ? '1' : '0.01'}
                  min={0.0001}
                  max={10000}
                />
                {result.isValid && (
                  <p className="mt-3 text-sm text-cultr-forest font-medium">
                    = {formatNumber(result.doseMcg, 0)} mcg = {formatNumber(result.doseMg, 3)} mg
                  </p>
                )}
              </div>

              {/* Syringe */}
              <div className="grad-light border border-cultr-sage rounded-2xl p-6">
                <HeadingRow icon={<Syringe className="w-5 h-5 text-cultr-forest" />} title="Syringe Size" />
                <PillRow
                  values={SYRINGE_OPTIONS}
                  selected={syringeMl}
                  onSelect={setSyringeMl}
                  unit=" mL"
                />
                <CustomNumberInput
                  placeholder="mL"
                  value={syringeMl}
                  onChange={setSyringeMl}
                  step="0.1"
                  min={0.01}
                  max={10}
                />
                <p className="mt-3 text-xs text-cultr-textMuted">Used for capacity warnings (U-100 insulin syringe).</p>
              </div>

              {/* Weight-based accordion */}
              <WeightBasedDoseCard
                initialWeight={weight ?? undefined}
                initialWeightUnit={weightUnit}
                initialDosePerKg={dosePerKg ?? undefined}
                initialDosePerKgUnit={dosePerKgUnit}
                onApply={handleWeightApply}
              />
            </div>

            {/* Results — visually first on mobile (order-1), second on desktop. */}
            <div className="lg:sticky lg:top-24 h-fit space-y-6 order-1 lg:order-2">
              {/* Capacity banner — above the meter so it's impossible to miss */}
              <CapacityWarningBanner
                capacityStatus={result.capacityStatus}
                drawMl={result.drawMl}
                syringeMl={syringeMl}
                recommendedSyringeMl={result.recommendedSyringeMl}
                capacityPct={result.capacityPct}
              />

              <div className="grad-dark text-white rounded-2xl p-8">
                <h3 className="font-display font-bold text-lg mb-6 text-white/80">Draw Amount</h3>
                {result.isValid ? (
                  <div className="flex flex-col items-center gap-8 sm:flex-row">
                    {syringeMl > 0 && (
                      <div className="flex-shrink-0 rounded-xl bg-white/10 p-4">
                        <SyringeMeter
                          syringeMl={syringeMl}
                          drawMl={result.drawMl}
                          drawUnits={result.drawUnitsU100}
                          capacityStatus={result.capacityStatus}
                          capacityPct={result.capacityPct}
                        />
                      </div>
                    )}
                    <div className={cn('flex-1 space-y-6', syringeMl > 0 ? '' : 'text-center')}>
                      <div>
                        <div className="text-5xl font-display font-bold mb-1">
                          {formatNumber(result.drawUnitsU100, 1)}
                        </div>
                        <div className="text-white/70 text-lg">units</div>
                      </div>
                      <div className="pt-4 border-t border-white/20">
                        <div className="text-2xl font-display font-bold">
                          {formatNumber(result.drawMl, 3)} mL
                        </div>
                        <div className="text-white/60 text-sm">volume to draw</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl font-display font-bold text-white/40">—</div>
                    <p className="text-white/50 mt-4">Enter valid values to calculate</p>
                  </div>
                )}
              </div>

              {/* Reconstitution facts */}
              {result.isValid && (
                <div className="grad-light border border-cultr-sage rounded-2xl p-6 space-y-4">
                  <h4 className="font-display font-bold text-cultr-text">Reconstitution details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FactTile value={formatNumber(result.concentrationMgPerMl, 2)} label="mg/mL concentration" />
                    <FactTile value={formatNumber(result.dosesPerVial, 0)} label="doses per vial" />
                  </div>
                  <div className="pt-4 border-t border-cultr-sage/50">
                    <p className="text-xs text-cultr-textMuted">
                      <strong>Formula:</strong> {vialMg} mg ÷ {waterMl} mL ={' '}
                      {formatNumber(result.concentrationMgPerMl, 2)} mg/mL
                      <br />
                      {formatNumber(result.doseMg, 3)} mg ÷ {formatNumber(result.concentrationMgPerMl, 2)}{' '}
                      mg/mL = {formatNumber(result.drawMl, 3)} mL ={' '}
                      {formatNumber(result.drawUnitsU100, 1)} units
                    </p>
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="grad-mint border border-cultr-sage rounded-2xl p-5">
                <p className="text-xs text-cultr-textMuted leading-relaxed">
                  <strong className="text-cultr-text">Note:</strong> This calculator uses the U-100 insulin
                  syringe scale where 100 units = 1 mL. Always verify calculations with your CULTR Health
                  provider before administration.
                </p>
              </div>
            </div>
          </div>

          {/* Full-width therapy planner + instruction card */}
          <TherapyPlanCard
            frequency={frequency}
            therapyLengthWeeks={therapyLengthWeeks}
            onFrequencyChange={setFrequency}
            onLengthChange={setTherapyLengthWeeks}
            totals={result.therapyTotals}
            hasBasis={result.isValid}
          />

          {result.isValid && (
            <InstructionCard
              therapyLabel={selectedPreset?.label ?? null}
              therapyCompound={selectedPreset?.compound ?? null}
              vialMg={vialMg}
              waterMl={waterMl}
              dose={dose}
              doseUnit={doseUnit}
              drawMl={result.drawMl}
              drawUnitsU100={result.drawUnitsU100}
              concentrationMgPerMl={result.concentrationMgPerMl}
              syringeMl={syringeMl || null}
              warnings={result.warnings}
              pdfPayload={{
                therapyLabel: selectedPreset?.label ?? null,
                therapyCompound: selectedPreset?.compound ?? null,
                vialMg,
                waterMl,
                dose,
                doseUnit,
                syringeMl: syringeMl > 0 ? syringeMl : null,
                frequency: frequency ?? null,
                therapyLengthWeeks: therapyLengthWeeks ?? null,
              }}
            />
          )}
        </div>
      </section>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────
// Small internal helpers
// ────────────────────────────────────────────────────────────────────

function HeadingRow({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      {icon}
      <h3 className="font-display font-bold text-cultr-text">{title}</h3>
    </div>
  )
}

function PillRow({
  values,
  selected,
  onSelect,
  unit = '',
}: {
  values: readonly number[]
  selected: number
  onSelect: (value: number) => void
  unit?: string
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onSelect(option)}
          className={cn(
            'px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium transition-all',
            selected === option
              ? 'bg-cultr-forest text-white'
              : 'bg-white border border-cultr-sage text-cultr-text hover:border-cultr-forest/50'
          )}
        >
          {option}
          {unit}
        </button>
      ))}
    </div>
  )
}

function CustomNumberInput({
  placeholder,
  value,
  onChange,
  step = '1',
  min,
  max,
}: {
  placeholder: string
  value: number
  onChange: (value: number) => void
  step?: string
  min?: number
  max?: number
}) {
  const [internal, setInternal] = useState<string>(value ? String(value) : '')

  // Sync from the parent `value` only when it's genuinely different from what
  // the input currently shows. Comparing numerically avoids clobbering partial
  // strings like "2." (parseFloat → 2) while the user is still typing, which
  // would otherwise reset the cursor and strip their trailing decimal.
  useEffect(() => {
    setInternal((prev) => {
      const prevNum = parseFloat(prev)
      if (Number.isFinite(prevNum) && prevNum === value) return prev
      return value ? String(value) : ''
    })
  }, [value])

  return (
    <div className="mt-3">
      <input
        type="number"
        inputMode="decimal"
        aria-label={`Custom ${placeholder} value`}
        placeholder={`Custom ${placeholder}`}
        value={internal}
        step={step}
        min={min}
        max={max}
        onChange={(e) => {
          const raw = e.target.value
          setInternal(raw)
          const parsed = parseFloat(raw)
          if (!Number.isFinite(parsed)) {
            onChange(0)
            return
          }
          // Clamp to [min, max] so the math layer never receives wildly
          // out-of-range values typed into the custom input (mirrors the
          // clamping done in lib/dosing-calculator/url-state.ts).
          let clamped = parsed
          if (typeof min === 'number') clamped = Math.max(clamped, min)
          if (typeof max === 'number') clamped = Math.min(clamped, max)
          onChange(clamped)
        }}
        className="w-full px-4 py-2 rounded-lg border border-cultr-sage grad-white text-cultr-text focus:border-cultr-forest focus:ring-1 focus:ring-cultr-forest/50 outline-none transition-all text-sm"
      />
    </div>
  )
}

function FactTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-cultr-sage/50">
      <div className="text-2xl font-display font-bold text-cultr-forest">{value}</div>
      <div className="text-xs text-cultr-textMuted">{label}</div>
    </div>
  )
}
