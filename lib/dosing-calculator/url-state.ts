// CULTR Dosing Calculator — URL state encode/decode.
//
// We serialize the calculator's meaningful input state into query params so
// support reps and product pages can deep-link a pre-filled calculator:
//   /tools/dosing-calculator?preset=glp1-tirz&vial=20&water=3&dose=2.5&unit=mg&syringe=1&freq=weekly&len=12
//
// Everything is clamped to safe ranges and enums are allow-listed — the URL
// should never be able to push the UI into an invalid state.

import {
  frequencyToPerWeek,
  type DosageFrequency,
  type DoseUnit,
  type WeightUnit,
} from '@/lib/peptide-calculator'
import {
  THERAPY_PRESETS,
  type TherapyPreset,
} from '@/lib/config/calculator-presets'

const DOSE_UNITS: DoseUnit[] = ['mcg', 'mg']
const WEIGHT_UNITS: WeightUnit[] = ['lb', 'kg']
const FREQUENCIES: DosageFrequency[] = [
  'daily',
  'every-other-day',
  'twice-weekly',
  'weekly',
  'biweekly',
]

export interface DosingUrlState {
  presetId: string | null
  vialMg: number | null
  waterMl: number | null
  dose: number | null
  doseUnit: DoseUnit | null
  syringeMl: number | null
  weight: number | null
  weightUnit: WeightUnit | null
  frequency: DosageFrequency | null
  therapyLengthWeeks: number | null
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function parsePositiveFloat(raw: string | null, min: number, max: number): number | null {
  if (!raw) return null
  const num = Number(raw)
  if (!Number.isFinite(num) || num <= 0) return null
  return clamp(num, min, max)
}

function parsePositiveInt(raw: string | null, min: number, max: number): number | null {
  const num = parsePositiveFloat(raw, min, max)
  if (num === null) return null
  return Math.floor(num)
}

function parseEnum<T extends string>(raw: string | null, whitelist: readonly T[]): T | null {
  if (!raw) return null
  return (whitelist as readonly string[]).includes(raw) ? (raw as T) : null
}

export function decodeUrlState(params: URLSearchParams): DosingUrlState {
  const presetRaw = params.get('preset')
  const preset: TherapyPreset | null = presetRaw
    ? THERAPY_PRESETS.find((p) => p.id === presetRaw) ?? null
    : null

  return {
    presetId: preset?.id ?? null,
    vialMg: parsePositiveFloat(params.get('vial'), 0.01, 10000),
    waterMl: parsePositiveFloat(params.get('water'), 0.01, 100),
    dose: parsePositiveFloat(params.get('dose'), 0.0001, 10000),
    doseUnit: parseEnum(params.get('unit'), DOSE_UNITS),
    syringeMl: parsePositiveFloat(params.get('syringe'), 0.01, 10),
    weight: parsePositiveFloat(params.get('weight'), 1, 1000),
    weightUnit: parseEnum(params.get('weightUnit'), WEIGHT_UNITS),
    frequency: parseEnum(params.get('freq'), FREQUENCIES),
    therapyLengthWeeks: parsePositiveInt(params.get('len'), 1, 52),
  }
}

export function encodeUrlState(state: Partial<DosingUrlState>): URLSearchParams {
  const params = new URLSearchParams()
  if (state.presetId) params.set('preset', state.presetId)
  if (state.vialMg != null && state.vialMg > 0) params.set('vial', formatNumberParam(state.vialMg))
  if (state.waterMl != null && state.waterMl > 0) params.set('water', formatNumberParam(state.waterMl))
  if (state.dose != null && state.dose > 0) params.set('dose', formatNumberParam(state.dose))
  if (state.doseUnit) params.set('unit', state.doseUnit)
  if (state.syringeMl != null && state.syringeMl > 0) params.set('syringe', formatNumberParam(state.syringeMl))
  if (state.weight != null && state.weight > 0) params.set('weight', formatNumberParam(state.weight))
  if (state.weightUnit) params.set('weightUnit', state.weightUnit)
  if (state.frequency) params.set('freq', state.frequency)
  if (state.therapyLengthWeeks != null && state.therapyLengthWeeks > 0) {
    params.set('len', String(state.therapyLengthWeeks))
  }
  return params
}

// Matches the calculator's display precision; avoids noisy 0.15000000000000002 in URLs.
function formatNumberParam(value: number): string {
  if (!Number.isFinite(value)) return ''
  const rounded = Math.round(value * 10000) / 10000
  return String(rounded)
}

// Sanity helper for frequency → doses-per-week that excludes unknown values.
export function isKnownFrequency(value: string): value is DosageFrequency {
  return (FREQUENCIES as readonly string[]).includes(value) && Number.isFinite(frequencyToPerWeek(value as DosageFrequency))
}
