import { describe, it, expect } from 'vitest'
import {
  SIPHOX_BIOMARKER_MAPPINGS,
  getBiomarkerByName,
  getBiomarkersByCategory,
  type BiomarkerCategory,
  type SiphoxBiomarkerMapping,
} from '@/lib/config/siphox-biomarkers'

// ============================================================
// COVERAGE & COMPLETENESS
// ============================================================

describe('SIPHOX_BIOMARKER_MAPPINGS', () => {
  it('has at least 40 entries (CSV has ~50)', () => {
    expect(SIPHOX_BIOMARKER_MAPPINGS.length).toBeGreaterThanOrEqual(40)
  })

  it('has no duplicate siphoxName values', () => {
    const names = SIPHOX_BIOMARKER_MAPPINGS.map(m => m.siphoxName)
    const uniqueNames = new Set(names)
    expect(uniqueNames.size).toBe(names.length)
  })

  it('every entry has all required fields (non-empty strings)', () => {
    for (const mapping of SIPHOX_BIOMARKER_MAPPINGS) {
      expect(mapping.siphoxName).toBeTruthy()
      expect(mapping.displayName).toBeTruthy()
      expect(mapping.category).toBeTruthy()
      expect(mapping.unit).toBeTruthy()
      expect(mapping.description).toBeTruthy()
    }
  })

  it('every entry has a valid category', () => {
    const validCategories: BiomarkerCategory[] = [
      'metabolic', 'nutritional', 'heart', 'hormonal',
      'inflammation', 'thyroid', 'extended',
    ]
    for (const mapping of SIPHOX_BIOMARKER_MAPPINGS) {
      expect(validCategories).toContain(mapping.category)
    }
  })

  it('all 7 categories are represented', () => {
    const categories = new Set(SIPHOX_BIOMARKER_MAPPINGS.map(m => m.category))
    expect(categories.has('metabolic')).toBe(true)
    expect(categories.has('nutritional')).toBe(true)
    expect(categories.has('heart')).toBe(true)
    expect(categories.has('hormonal')).toBe(true)
    expect(categories.has('inflammation')).toBe(true)
    expect(categories.has('thyroid')).toBe(true)
    expect(categories.has('extended')).toBe(true)
  })
})

// ============================================================
// LOOKUP HELPERS
// ============================================================

describe('getBiomarkerByName', () => {
  it('returns correct mapping for known name "HbA1c"', () => {
    const result = getBiomarkerByName('HbA1c')
    expect(result).toBeDefined()
    expect(result!.category).toBe('metabolic')
    expect(result!.unit).toBe('%')
  })

  it('returns correct mapping for known name "ApoB"', () => {
    const result = getBiomarkerByName('ApoB')
    expect(result).toBeDefined()
    expect(result!.category).toBe('heart')
    expect(result!.unit).toBe('mg/dL')
  })

  it('returns correct mapping for known name "hsCRP"', () => {
    const result = getBiomarkerByName('hsCRP')
    expect(result).toBeDefined()
    expect(result!.category).toBe('inflammation')
  })

  it('returns correct mapping for known name "TSH"', () => {
    const result = getBiomarkerByName('TSH')
    expect(result).toBeDefined()
    expect(result!.category).toBe('thyroid')
  })

  it('is case-insensitive', () => {
    const lower = getBiomarkerByName('hba1c')
    const upper = getBiomarkerByName('HBA1C')
    expect(lower).toBeDefined()
    expect(upper).toBeDefined()
    expect(lower!.siphoxName).toBe(upper!.siphoxName)
  })

  it('returns undefined for unknown names', () => {
    const result = getBiomarkerByName('NonExistentBiomarker')
    expect(result).toBeUndefined()
  })
})

describe('getBiomarkersByCategory', () => {
  it('returns non-empty array for each category', () => {
    const categories: BiomarkerCategory[] = [
      'metabolic', 'nutritional', 'heart', 'hormonal',
      'inflammation', 'thyroid', 'extended',
    ]
    for (const category of categories) {
      const results = getBiomarkersByCategory(category)
      expect(results.length).toBeGreaterThan(0)
    }
  })

  it('returns only entries matching the requested category', () => {
    const results = getBiomarkersByCategory('heart')
    for (const entry of results) {
      expect(entry.category).toBe('heart')
    }
  })

  it('returns empty array for invalid category', () => {
    const results = getBiomarkersByCategory('invalid' as BiomarkerCategory)
    expect(results).toEqual([])
  })
})
