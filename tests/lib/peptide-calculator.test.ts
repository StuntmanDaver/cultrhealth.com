import { describe, expect, it } from 'vitest'
import {
  calcPeptide,
  CAPACITY_EXCEEDS_PCT,
  CAPACITY_NEAR_PCT,
  deriveDoseFromWeight,
  formatNumber,
  frequencyLabel,
  frequencyToPerWeek,
} from '@/lib/peptide-calculator'

describe('calcPeptide — base math (existing behavior preserved)', () => {
  it('reference example: 5 mg vial + 3 mL water + 250 mcg dose → 0.15 mL / 15 units', () => {
    const result = calcPeptide({ vialMg: 5, waterMl: 3, dose: 250, doseUnit: 'mcg' })
    expect(result.isValid).toBe(true)
    expect(result.doseMg).toBeCloseTo(0.25, 5)
    expect(result.concentrationMgPerMl).toBeCloseTo(5 / 3, 5)
    expect(result.drawMl).toBeCloseTo(0.15, 5)
    expect(result.drawUnitsU100).toBeCloseTo(15, 5)
    expect(result.dosesPerVial).toBeCloseTo(20, 5)
  })

  it('returns isValid=false with warnings for non-positive inputs', () => {
    const bad = calcPeptide({ vialMg: 0, waterMl: 3, dose: 250, doseUnit: 'mcg' })
    expect(bad.isValid).toBe(false)
    expect(bad.drawMl).toBeNaN()
    expect(bad.warnings.join(' ')).toMatch(/Vial amount/)
  })

  it('warns when dose exceeds vial content but still computes', () => {
    const result = calcPeptide({ vialMg: 1, waterMl: 1, dose: 2, doseUnit: 'mg' })
    expect(result.isValid).toBe(true)
    expect(result.warnings.some((w) => /exceeds total peptide/i.test(w))).toBe(true)
  })
})

describe('calcPeptide — capacity zones', () => {
  it('reports "ok" when fill is below the near threshold', () => {
    // 10 mg / 3 mL → 3.33 mg/mL; 250 mcg = 0.075 mL on a 1 mL syringe = 7.5 %
    const result = calcPeptide({ vialMg: 10, waterMl: 3, dose: 250, doseUnit: 'mcg', syringeMl: 1.0 })
    expect(result.capacityStatus).toBe('ok')
    expect(result.capacityPct).toBeLessThan(CAPACITY_NEAR_PCT)
  })

  it('reports "near" between 70 % and 100 %', () => {
    // 2 mg / 1 mL → 2 mg/mL; 1.6 mg = 0.8 mL on 1 mL syringe = 80 %
    const result = calcPeptide({ vialMg: 2, waterMl: 1, dose: 1.6, doseUnit: 'mg', syringeMl: 1.0 })
    expect(result.capacityStatus).toBe('near')
    expect(result.capacityPct).toBeGreaterThanOrEqual(CAPACITY_NEAR_PCT)
    expect(result.capacityPct).toBeLessThan(CAPACITY_EXCEEDS_PCT)
  })

  it('reports "exceeds" and suggests the next-larger syringe at >= 100 %', () => {
    // 5 mg / 1 mL → 5 mg/mL; 1 mg = 0.2 mL on a 0.1 mL (fake small) — use realistic: 5 mg vial, 1 mL water, 1 mg dose, 0.1 mL syringe.
    // Simpler real case: 5 mg / 1 mL → 5 mg/mL; 2 mg = 0.4 mL on 0.3 mL syringe → 133 %
    const result = calcPeptide({ vialMg: 5, waterMl: 1, dose: 2, doseUnit: 'mg', syringeMl: 0.3 })
    expect(result.capacityStatus).toBe('exceeds')
    expect(result.capacityPct).toBeGreaterThanOrEqual(CAPACITY_EXCEEDS_PCT)
    expect(result.recommendedSyringeMl).toBe(0.5)
    expect(result.warnings.some((w) => /exceeds/i.test(w))).toBe(true)
  })

  it('reports "none" when no syringe is provided', () => {
    const result = calcPeptide({ vialMg: 5, waterMl: 3, dose: 250, doseUnit: 'mcg' })
    expect(result.capacityStatus).toBe('none')
    expect(result.capacityPct).toBe(0)
    expect(result.recommendedSyringeMl).toBeNull()
  })
})

describe('calcPeptide — therapy totals', () => {
  it('no totals when frequency + length not provided', () => {
    const result = calcPeptide({ vialMg: 20, waterMl: 3, dose: 2.5, doseUnit: 'mg' })
    expect(result.therapyTotals).toBeNull()
  })

  it('weekly × 12 weeks at 2.5 mg per dose, 20 mg vial → total 30 mg, 2 vials', () => {
    const result = calcPeptide({
      vialMg: 20,
      waterMl: 3,
      dose: 2.5,
      doseUnit: 'mg',
      frequency: 'weekly',
      therapyLengthWeeks: 12,
    })
    expect(result.therapyTotals).not.toBeNull()
    expect(result.therapyTotals!.totalDoses).toBe(12)
    expect(result.therapyTotals!.totalMg).toBeCloseTo(30, 5)
    expect(result.therapyTotals!.totalVials).toBe(2)
    // 8 doses per 20 mg vial, 1 dose/week → ~56 days per vial
    expect(result.therapyTotals!.daysPerVial).toBe(56)
  })

  it('every-other-day × 4 weeks doubles a weekly 4-week cycle', () => {
    const weekly = calcPeptide({
      vialMg: 5, waterMl: 2, dose: 250, doseUnit: 'mcg',
      frequency: 'weekly', therapyLengthWeeks: 4,
    })
    const eod = calcPeptide({
      vialMg: 5, waterMl: 2, dose: 250, doseUnit: 'mcg',
      frequency: 'every-other-day', therapyLengthWeeks: 4,
    })
    expect(weekly.therapyTotals!.totalDoses).toBe(4)
    // EOD = 3.5 doses/week × 4 weeks = 14 (ceil)
    expect(eod.therapyTotals!.totalDoses).toBe(14)
    expect(eod.therapyTotals!.totalMg).toBeGreaterThan(weekly.therapyTotals!.totalMg)
  })
})

describe('deriveDoseFromWeight', () => {
  it('returns null for missing or zero inputs', () => {
    expect(deriveDoseFromWeight({ weight: 0, weightUnit: 'lb', dosePerKg: 10, dosePerKgUnit: 'mcg/kg' })).toBeNull()
    expect(deriveDoseFromWeight({ weight: 180, weightUnit: 'lb', dosePerKg: 0, dosePerKgUnit: 'mcg/kg' })).toBeNull()
  })

  it('180 lb × 10 mcg/kg ≈ 816 mcg (mcg unit)', () => {
    const result = deriveDoseFromWeight({ weight: 180, weightUnit: 'lb', dosePerKg: 10, dosePerKgUnit: 'mcg/kg' })
    expect(result).not.toBeNull()
    expect(result!.doseUnit).toBe('mcg')
    expect(result!.weightKg).toBeCloseTo(180 / 2.2046, 2)
    expect(result!.dose).toBeCloseTo((180 / 2.2046) * 10, 2)
  })

  it('82 kg × 0.05 mg/kg = 4.1 mg', () => {
    const result = deriveDoseFromWeight({ weight: 82, weightUnit: 'kg', dosePerKg: 0.05, dosePerKgUnit: 'mg/kg' })
    expect(result).not.toBeNull()
    expect(result!.doseUnit).toBe('mg')
    expect(result!.weightKg).toBe(82)
    expect(result!.dose).toBeCloseTo(4.1, 5)
  })
})

describe('frequency helpers', () => {
  it('frequencyToPerWeek matches schedule expectations', () => {
    expect(frequencyToPerWeek('daily')).toBe(7)
    expect(frequencyToPerWeek('every-other-day')).toBe(3.5)
    expect(frequencyToPerWeek('twice-weekly')).toBe(2)
    expect(frequencyToPerWeek('weekly')).toBe(1)
    expect(frequencyToPerWeek('biweekly')).toBe(0.5)
  })

  it('frequencyLabel produces human-readable strings', () => {
    expect(frequencyLabel('every-other-day')).toBe('Every other day')
    expect(frequencyLabel('biweekly')).toBe('Every 2 weeks')
  })
})

describe('formatNumber', () => {
  it('renders NaN/Infinity as em-dash', () => {
    expect(formatNumber(NaN, 2)).toBe('—')
    expect(formatNumber(Infinity, 2)).toBe('—')
  })

  it('respects decimal places', () => {
    expect(formatNumber(1.2345, 2)).toBe('1.23')
    expect(formatNumber(1.2345, 0)).toBe('1')
  })
})
