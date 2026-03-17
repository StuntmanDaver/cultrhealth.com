import { describe, it, expect } from 'vitest'
import {
  SIPHOX_BIOMARKER_CATALOG,
  BIOMARKER_CATEGORIES,
  findBiomarker,
  getBiomarkersByCategory,
  getOrderedCategories,
} from '@/lib/siphox/biomarkers'
import type { BiomarkerCategory } from '@/lib/siphox/biomarkers'

describe('SIPHOX_BIOMARKER_CATALOG', () => {
  it('contains exactly 50 biomarkers', () => {
    expect(SIPHOX_BIOMARKER_CATALOG).toHaveLength(50)
  })

  it('has unique siphoxName values', () => {
    const names = SIPHOX_BIOMARKER_CATALOG.map(b => b.siphoxName)
    const unique = new Set(names)
    expect(unique.size).toBe(names.length)
  })

  it('every biomarker has required fields', () => {
    for (const b of SIPHOX_BIOMARKER_CATALOG) {
      expect(b.siphoxName).toBeTruthy()
      expect(b.displayName).toBeTruthy()
      expect(b.abbreviation).toBeTruthy()
      expect(b.category).toBeTruthy()
      expect(b.unit).toBeTruthy()
      expect(typeof b.lowerIsBetter).toBe('boolean')
      expect(b.description).toBeTruthy()
      expect(typeof b.sortOrder).toBe('number')
    }
  })

  it('all categories used in catalog are valid', () => {
    const validCategories = Object.keys(BIOMARKER_CATEGORIES) as BiomarkerCategory[]
    for (const b of SIPHOX_BIOMARKER_CATALOG) {
      expect(validCategories).toContain(b.category)
    }
  })

  it('has biomarkers in all 7 categories', () => {
    const usedCategories = new Set(SIPHOX_BIOMARKER_CATALOG.map(b => b.category))
    expect(usedCategories.size).toBe(7)
    expect(usedCategories).toContain('heart')
    expect(usedCategories).toContain('metabolic')
    expect(usedCategories).toContain('hormonal')
    expect(usedCategories).toContain('inflammation')
    expect(usedCategories).toContain('thyroid')
    expect(usedCategories).toContain('nutritional')
    expect(usedCategories).toContain('extended')
  })

  it('category counts match expected distribution', () => {
    const counts: Record<string, number> = {}
    for (const b of SIPHOX_BIOMARKER_CATALOG) {
      counts[b.category] = (counts[b.category] || 0) + 1
    }
    expect(counts.heart).toBe(10)
    expect(counts.metabolic).toBe(11)
    expect(counts.hormonal).toBe(10)
    expect(counts.inflammation).toBe(3)
    expect(counts.thyroid).toBe(4)
    expect(counts.nutritional).toBe(8)
    expect(counts.extended).toBe(4)
  })
})

describe('findBiomarker', () => {
  it('finds by exact name', () => {
    const result = findBiomarker('HDL-C')
    expect(result).not.toBeNull()
    expect(result!.displayName).toBe('HDL Cholesterol')
    expect(result!.category).toBe('heart')
  })

  it('finds case-insensitively', () => {
    const result = findBiomarker('hdl-c')
    expect(result).not.toBeNull()
    expect(result!.displayName).toBe('HDL Cholesterol')
  })

  it('normalizes whitespace', () => {
    const result = findBiomarker('  HDL-C  ')
    expect(result).not.toBeNull()
  })

  it('finds biomarkers with complex names', () => {
    const crp = findBiomarker('High-Sensitivity C-Reactive Protein (hs-CRP)')
    expect(crp).not.toBeNull()
    expect(crp!.abbreviation).toBe('hs-CRP')
    expect(crp!.category).toBe('inflammation')

    const tsh = findBiomarker('Thyroid Stimulating Hormone (TSH)')
    expect(tsh).not.toBeNull()
    expect(tsh!.category).toBe('thyroid')
  })

  it('returns null for unknown biomarkers', () => {
    expect(findBiomarker('Unknown Marker XYZ')).toBeNull()
    expect(findBiomarker('')).toBeNull()
  })
})

describe('getBiomarkersByCategory', () => {
  it('returns all 7 categories', () => {
    const grouped = getBiomarkersByCategory()
    expect(Object.keys(grouped)).toHaveLength(7)
  })

  it('biomarkers within each category are sorted by sortOrder', () => {
    const grouped = getBiomarkersByCategory()
    for (const [, biomarkers] of Object.entries(grouped)) {
      for (let i = 1; i < biomarkers.length; i++) {
        expect(biomarkers[i].sortOrder).toBeGreaterThanOrEqual(biomarkers[i - 1].sortOrder)
      }
    }
  })
})

describe('getOrderedCategories', () => {
  it('returns 7 categories in sort order', () => {
    const categories = getOrderedCategories()
    expect(categories).toHaveLength(7)
    expect(categories[0].key).toBe('heart')
    expect(categories[1].key).toBe('metabolic')
    expect(categories[2].key).toBe('hormonal')
    expect(categories[3].key).toBe('inflammation')
    expect(categories[4].key).toBe('thyroid')
    expect(categories[5].key).toBe('nutritional')
    expect(categories[6].key).toBe('extended')
  })

  it('each category has label and description', () => {
    const categories = getOrderedCategories()
    for (const cat of categories) {
      expect(cat.label).toBeTruthy()
      expect(cat.description).toBeTruthy()
    }
  })
})

describe('BIOMARKER_CATEGORIES', () => {
  it('has unique sort orders', () => {
    const sortOrders = Object.values(BIOMARKER_CATEGORIES).map(c => c.sortOrder)
    const unique = new Set(sortOrders)
    expect(unique.size).toBe(sortOrders.length)
  })
})
