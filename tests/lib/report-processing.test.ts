import { describe, it, expect } from 'vitest'
import { processReport } from '@/lib/siphox/reports'
import type { SiphoxBiomarkerResult } from '@/lib/siphox/types'

function makeBiomarker(overrides: Partial<SiphoxBiomarkerResult> & { biomarker: string }): SiphoxBiomarkerResult {
  return {
    value: 5.0,
    unit: 'mg/dL',
    ...overrides,
  }
}

describe('processReport', () => {
  it('returns empty categories for empty biomarkers', () => {
    const result = processReport({
      _id: 'report-1',
      biomarkers: [],
      created_at: '2026-03-17',
    })
    expect(result.reportId).toBe('report-1')
    expect(result.categories).toHaveLength(0)
    expect(result.summary.totalBiomarkers).toBe(0)
  })

  it('categorizes known biomarkers correctly', () => {
    const result = processReport({
      _id: 'report-2',
      biomarkers: [
        makeBiomarker({ biomarker: 'HDL-C', value: 55, unit: 'mg/dL' }),
        makeBiomarker({ biomarker: 'Fasting Glucose', value: 85, unit: 'mg/dL' }),
        makeBiomarker({
          biomarker: 'Thyroid Stimulating Hormone (TSH)',
          value: 2.1,
          unit: 'mIU/L',
        }),
      ],
    })

    expect(result.categories.length).toBeGreaterThanOrEqual(3)

    const heartCat = result.categories.find(c => c.key === 'heart')
    expect(heartCat).toBeDefined()
    expect(heartCat!.biomarkers).toHaveLength(1)
    expect(heartCat!.biomarkers[0].displayName).toBe('HDL Cholesterol')

    const metabolicCat = result.categories.find(c => c.key === 'metabolic')
    expect(metabolicCat).toBeDefined()
    expect(metabolicCat!.biomarkers[0].displayName).toBe('Fasting Glucose')

    const thyroidCat = result.categories.find(c => c.key === 'thyroid')
    expect(thyroidCat).toBeDefined()
    expect(thyroidCat!.biomarkers[0].displayName).toBe('TSH')
  })

  it('assigns unknown biomarkers to extended category', () => {
    const result = processReport({
      _id: 'report-3',
      biomarkers: [
        makeBiomarker({ biomarker: 'Some Future Marker', value: 10, unit: 'units' }),
      ],
    })

    const extendedCat = result.categories.find(c => c.key === 'extended')
    expect(extendedCat).toBeDefined()
    expect(extendedCat!.biomarkers[0].displayName).toBe('Some Future Marker')
  })

  it('computes status from SiPhox-provided status string', () => {
    const result = processReport({
      _id: 'report-4',
      biomarkers: [
        makeBiomarker({
          biomarker: 'HDL-C',
          value: 60,
          unit: 'mg/dL',
          status: 'optimal',
        }),
        makeBiomarker({
          biomarker: 'LDL-C',
          value: 180,
          unit: 'mg/dL',
          status: 'elevated',
        }),
      ],
    })

    const heartCat = result.categories.find(c => c.key === 'heart')!
    const hdl = heartCat.biomarkers.find(b => b.abbreviation === 'HDL-C')!
    expect(hdl.status).toBe('optimal')

    const ldl = heartCat.biomarkers.find(b => b.abbreviation === 'LDL-C')!
    expect(ldl.status).toBe('high')
  })

  it('computes status from reference ranges when no status string', () => {
    const result = processReport({
      _id: 'report-5',
      biomarkers: [
        makeBiomarker({
          biomarker: 'Fasting Glucose',
          value: 85,
          unit: 'mg/dL',
          reference_range: {
            low: 65,
            high: 100,
            optimal_low: 70,
            optimal_high: 90,
          },
        }),
      ],
    })

    const metabolicCat = result.categories.find(c => c.key === 'metabolic')!
    expect(metabolicCat.biomarkers[0].status).toBe('optimal')
  })

  it('marks null values as na', () => {
    const result = processReport({
      _id: 'report-6',
      biomarkers: [
        makeBiomarker({ biomarker: 'HDL-C', value: null, unit: 'mg/dL' }),
      ],
    })

    const heartCat = result.categories.find(c => c.key === 'heart')!
    expect(heartCat.biomarkers[0].status).toBe('na')
    expect(result.summary.naCount).toBe(1)
  })

  it('marks values below low range as low', () => {
    const result = processReport({
      _id: 'report-7',
      biomarkers: [
        makeBiomarker({
          biomarker: 'Vitamin D',
          value: 15,
          unit: 'ng/mL',
          reference_range: { low: 30, high: 100 },
        }),
      ],
    })

    const nutritionalCat = result.categories.find(c => c.key === 'nutritional')!
    expect(nutritionalCat.biomarkers[0].status).toBe('low')
  })

  it('marks values above high range as high', () => {
    const result = processReport({
      _id: 'report-8',
      biomarkers: [
        makeBiomarker({
          biomarker: 'Fasting Insulin',
          value: 25,
          unit: 'μIU/mL',
          reference_range: { low: 2, high: 15 },
        }),
      ],
    })

    const metabolicCat = result.categories.find(c => c.key === 'metabolic')!
    expect(metabolicCat.biomarkers[0].status).toBe('high')
  })

  it('calculates summary stats correctly', () => {
    const result = processReport({
      _id: 'report-9',
      biomarkers: [
        makeBiomarker({
          biomarker: 'HDL-C', value: 60, unit: 'mg/dL', status: 'optimal',
        }),
        makeBiomarker({
          biomarker: 'LDL-C', value: 180, unit: 'mg/dL', status: 'high',
        }),
        makeBiomarker({
          biomarker: 'Vitamin D', value: null, unit: 'ng/mL',
        }),
        makeBiomarker({
          biomarker: 'Fasting Glucose', value: 85, unit: 'mg/dL', status: 'normal',
        }),
      ],
    })

    expect(result.summary.totalBiomarkers).toBe(4)
    expect(result.summary.measuredCount).toBe(3)
    expect(result.summary.optimalCount).toBe(1)
    expect(result.summary.needsAttentionCount).toBe(1)
    expect(result.summary.naCount).toBe(1)
  })

  it('processes suggestions from report', () => {
    const result = processReport({
      _id: 'report-10',
      biomarkers: [],
      suggestions: [
        { text: 'Increase vitamin D intake', category: 'nutritional' },
        { text: 'Consider omega-3 supplementation', link: 'https://example.com' },
      ],
    })

    expect(result.suggestions).toHaveLength(2)
    expect(result.suggestions[0].text).toBe('Increase vitamin D intake')
    expect(result.suggestions[0].category).toBe('nutritional')
    expect(result.suggestions[1].link).toBe('https://example.com')
  })

  it('handles cached DB report format (report_data instead of biomarkers)', () => {
    const result = processReport({
      siphox_report_id: 'cached-1',
      report_data: [
        { biomarker: 'HDL-C', value: 55, unit: 'mg/dL' },
        { biomarker: 'Cortisol', value: 12, unit: 'μg/dL' },
      ],
      suggestions: [],
      created_at: '2026-03-17',
    })

    expect(result.reportId).toBe('cached-1')
    expect(result.summary.totalBiomarkers).toBe(2)
  })

  it('preserves lowerIsBetter from catalog', () => {
    const result = processReport({
      _id: 'report-11',
      biomarkers: [
        makeBiomarker({ biomarker: 'High-Sensitivity C-Reactive Protein (hs-CRP)', value: 0.5, unit: 'mg/L' }),
        makeBiomarker({ biomarker: 'Vitamin D', value: 50, unit: 'ng/mL' }),
      ],
    })

    const inflammationCat = result.categories.find(c => c.key === 'inflammation')!
    expect(inflammationCat.biomarkers[0].lowerIsBetter).toBe(true)

    const nutritionalCat = result.categories.find(c => c.key === 'nutritional')!
    expect(nutritionalCat.biomarkers[0].lowerIsBetter).toBe(false)
  })

  it('categories are ordered by sort order', () => {
    const result = processReport({
      _id: 'report-12',
      biomarkers: [
        makeBiomarker({ biomarker: 'Vitamin D', value: 50, unit: 'ng/mL' }),
        makeBiomarker({ biomarker: 'HDL-C', value: 55, unit: 'mg/dL' }),
        makeBiomarker({ biomarker: 'Thyroid Stimulating Hormone (TSH)', value: 2.0, unit: 'mIU/L' }),
      ],
    })

    const categoryOrder = result.categories.map(c => c.key)
    // heart (1) should come before thyroid (5) should come before nutritional (6)
    const heartIdx = categoryOrder.indexOf('heart')
    const thyroidIdx = categoryOrder.indexOf('thyroid')
    const nutritionalIdx = categoryOrder.indexOf('nutritional')
    expect(heartIdx).toBeLessThan(thyroidIdx)
    expect(thyroidIdx).toBeLessThan(nutritionalIdx)
  })
})
