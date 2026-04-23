// CULTR Calculator — Peptide reconstitution math engine
// Core per-injection calc + weight-based dose derivation + therapy-total planning

export type DoseUnit = 'mcg' | 'mg'
export type WeightUnit = 'lb' | 'kg'
export type DosePerKgUnit = 'mcg/kg' | 'mg/kg'
export type DosageFrequency =
  | 'daily'
  | 'every-other-day'
  | 'twice-weekly'
  | 'weekly'
  | 'biweekly'
export type CapacityStatus = 'none' | 'ok' | 'near' | 'exceeds'

// Capacity thresholds expressed as percent of syringe volume (drawMl / syringeMl * 100).
// "near" prompts a soft amber notice; "exceeds" blocks the calculation visually.
export const CAPACITY_NEAR_PCT = 70
export const CAPACITY_EXCEEDS_PCT = 100

// U-100 insulin syringe sizes we know about, smallest to largest. Used to
// suggest the next-larger size when the selected one overflows.
export const SYRINGE_SIZES_ML = [0.3, 0.5, 1.0, 3.0] as const

export type PeptideCalcInput = {
  vialMg: number
  waterMl: number
  dose: number
  doseUnit: DoseUnit
  syringeMl?: number
  frequency?: DosageFrequency
  therapyLengthWeeks?: number
}

export type TherapyTotals = {
  dosesPerWeek: number
  totalDoses: number
  totalMg: number
  totalVials: number
  daysPerVial: number
  refillInDays: number
}

export type PeptideCalcOutput = {
  isValid: boolean
  doseMg: number
  doseMcg: number
  concentrationMgPerMl: number
  drawMl: number
  drawUnitsU100: number
  dosesPerVial: number
  capacityStatus: CapacityStatus
  capacityPct: number
  recommendedSyringeMl: number | null
  warnings: string[]
  therapyTotals: TherapyTotals | null
}

/**
 * Calculate peptide reconstitution, per-injection draw volumes, capacity status,
 * and (optionally) total-therapy planning figures.
 *
 * Core formulas:
 *   concentration = vialMg / waterMl       (mg/mL)
 *   drawMl        = doseMg / concentration
 *   drawUnits     = drawMl * 100           (U-100 insulin syringe scale)
 *   dosesPerVial  = vialMg / doseMg
 *
 * Reference: 5 mg vial + 3 mL water + 250 mcg dose → 0.15 mL = 15 units.
 */
export function calcPeptide(input: PeptideCalcInput): PeptideCalcOutput {
  const { vialMg, waterMl, dose, doseUnit, syringeMl, frequency, therapyLengthWeeks } = input
  const warnings: string[] = []

  const invalid: PeptideCalcOutput = {
    isValid: false,
    doseMg: NaN,
    doseMcg: NaN,
    concentrationMgPerMl: NaN,
    drawMl: NaN,
    drawUnitsU100: NaN,
    dosesPerVial: NaN,
    capacityStatus: 'none',
    capacityPct: 0,
    recommendedSyringeMl: null,
    warnings,
    therapyTotals: null,
  }

  if (!(vialMg > 0)) warnings.push('Vial amount must be greater than 0 mg.')
  if (!(waterMl > 0)) warnings.push('Water volume must be greater than 0 mL.')
  if (!(dose > 0)) warnings.push('Dose must be greater than 0.')
  if (warnings.length) return invalid

  const doseMg = doseUnit === 'mg' ? dose : dose / 1000
  const doseMcg = doseMg * 1000

  if (doseMg > vialMg) {
    warnings.push('Dose exceeds total peptide in vial.')
  }

  const concentrationMgPerMl = vialMg / waterMl
  const drawMl = doseMg / concentrationMgPerMl
  const drawUnitsU100 = drawMl * 100
  const dosesPerVial = vialMg / doseMg

  let capacityStatus: CapacityStatus = 'none'
  let capacityPct = 0
  let recommendedSyringeMl: number | null = null

  if (syringeMl != null && syringeMl > 0) {
    capacityPct = Math.min((drawMl / syringeMl) * 100, 999)
    if (capacityPct >= CAPACITY_EXCEEDS_PCT) {
      capacityStatus = 'exceeds'
      const next = SYRINGE_SIZES_ML.find((size) => size > syringeMl && drawMl <= size)
      recommendedSyringeMl = next ?? null
      const maxUnits = syringeMl * 100
      warnings.push(
        `Draw volume ${drawMl.toFixed(3)} mL (${drawUnitsU100.toFixed(1)} units) exceeds the ${syringeMl} mL syringe capacity of ${maxUnits} units.`
      )
    } else if (capacityPct >= CAPACITY_NEAR_PCT) {
      capacityStatus = 'near'
    } else {
      capacityStatus = 'ok'
    }
  }

  let therapyTotals: TherapyTotals | null = null
  if (frequency && therapyLengthWeeks && therapyLengthWeeks > 0 && doseMg > 0) {
    const dosesPerWeek = frequencyToPerWeek(frequency)
    const totalDoses = Math.ceil(dosesPerWeek * therapyLengthWeeks)
    const totalMg = totalDoses * doseMg
    const totalVials = Math.max(1, Math.ceil(totalMg / vialMg))
    const daysPerVial = dosesPerWeek > 0 ? Math.floor((dosesPerVial / dosesPerWeek) * 7) : 0
    therapyTotals = {
      dosesPerWeek,
      totalDoses,
      totalMg,
      totalVials,
      daysPerVial,
      refillInDays: daysPerVial,
    }
  }

  return {
    isValid: true,
    doseMg,
    doseMcg,
    concentrationMgPerMl,
    drawMl,
    drawUnitsU100,
    dosesPerVial,
    capacityStatus,
    capacityPct,
    recommendedSyringeMl,
    warnings,
    therapyTotals,
  }
}

export function frequencyToPerWeek(freq: DosageFrequency): number {
  switch (freq) {
    case 'daily':
      return 7
    case 'every-other-day':
      return 3.5
    case 'twice-weekly':
      return 2
    case 'weekly':
      return 1
    case 'biweekly':
      return 0.5
  }
}

export function frequencyLabel(freq: DosageFrequency): string {
  switch (freq) {
    case 'daily':
      return 'Daily'
    case 'every-other-day':
      return 'Every other day'
    case 'twice-weekly':
      return 'Twice weekly'
    case 'weekly':
      return 'Weekly'
    case 'biweekly':
      return 'Every 2 weeks'
  }
}

export type WeightBasedInput = {
  weight: number
  weightUnit: WeightUnit
  dosePerKg: number
  dosePerKgUnit: DosePerKgUnit
}

export type WeightBasedOutput = {
  weightKg: number
  dose: number
  doseUnit: DoseUnit
}

/**
 * Convert a body-weight target (e.g. 10 mcg/kg × 180 lb) into an absolute
 * per-injection dose the rest of the calculator can consume. Pounds are
 * converted to kilograms using the standard factor (2.2046 lb/kg).
 */
export function deriveDoseFromWeight(input: WeightBasedInput): WeightBasedOutput | null {
  const { weight, weightUnit, dosePerKg, dosePerKgUnit } = input
  if (!(weight > 0) || !(dosePerKg > 0)) return null
  const weightKg = weightUnit === 'kg' ? weight : weight / 2.2046
  const dose = weightKg * dosePerKg
  return {
    weightKg,
    dose,
    doseUnit: dosePerKgUnit === 'mcg/kg' ? 'mcg' : 'mg',
  }
}

export function formatNumber(value: number, decimals: number): string {
  if (isNaN(value) || !isFinite(value)) return '—'
  return value.toFixed(decimals)
}
