import { describe, expect, it } from 'vitest'
import {
  decodeUrlState,
  encodeUrlState,
  isKnownFrequency,
} from '@/lib/dosing-calculator/url-state'

function roundTrip(input: Parameters<typeof encodeUrlState>[0]) {
  return decodeUrlState(encodeUrlState(input))
}

describe('encode / decode round-trip', () => {
  it('preserves all known fields', () => {
    const source = {
      presetId: 'glp1-tirz',
      vialMg: 20,
      waterMl: 3,
      dose: 2.5,
      doseUnit: 'mg' as const,
      syringeMl: 0.5,
      weight: 180,
      weightUnit: 'lb' as const,
      frequency: 'weekly' as const,
      therapyLengthWeeks: 12,
    }
    const decoded = roundTrip(source)
    expect(decoded).toEqual(source)
  })

  it('drops undefined / zero values instead of emitting junk keys', () => {
    const params = encodeUrlState({ vialMg: 10 })
    expect(params.toString()).toBe('vial=10')
  })
})

describe('decodeUrlState — input hardening', () => {
  it('clamps vial/water/dose to safe ranges', () => {
    const params = new URLSearchParams('vial=99999&water=0.0001&dose=-5')
    const state = decodeUrlState(params)
    expect(state.vialMg).toBeLessThanOrEqual(10000)
    // water has a 0.01 minimum clamp
    expect(state.waterMl).toBeGreaterThanOrEqual(0.01)
    // negative dose is rejected entirely
    expect(state.dose).toBeNull()
  })

  it('rejects unknown enum values', () => {
    const params = new URLSearchParams('unit=picograms&freq=never&weightUnit=stones&preset=not-a-real-one')
    const state = decodeUrlState(params)
    expect(state.doseUnit).toBeNull()
    expect(state.frequency).toBeNull()
    expect(state.weightUnit).toBeNull()
    expect(state.presetId).toBeNull()
  })

  it('accepts known preset ids', () => {
    const params = new URLSearchParams('preset=glp1-sema')
    const state = decodeUrlState(params)
    expect(state.presetId).toBe('glp1-sema')
  })

  it('parses therapy length as a positive integer clamped to 52 weeks', () => {
    expect(decodeUrlState(new URLSearchParams('len=12')).therapyLengthWeeks).toBe(12)
    expect(decodeUrlState(new URLSearchParams('len=0')).therapyLengthWeeks).toBeNull()
    expect(decodeUrlState(new URLSearchParams('len=9999')).therapyLengthWeeks).toBe(52)
  })

  it('is tolerant of entirely empty query strings', () => {
    const state = decodeUrlState(new URLSearchParams(''))
    expect(Object.values(state).every((v) => v === null)).toBe(true)
  })
})

describe('isKnownFrequency', () => {
  it('accepts all supported values', () => {
    expect(isKnownFrequency('daily')).toBe(true)
    expect(isKnownFrequency('every-other-day')).toBe(true)
    expect(isKnownFrequency('biweekly')).toBe(true)
  })
  it('rejects unknown values', () => {
    expect(isKnownFrequency('yearly')).toBe(false)
    expect(isKnownFrequency('')).toBe(false)
  })
})
