import { describe, it, expect } from 'vitest'
import { buildPartnerNote, formatMedicationsList } from '@/lib/intake-utils'

describe('formatMedicationsList', () => {
  it('formats medication objects with name, dosage, and frequency', () => {
    const meds = [
      { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' },
      { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
    ]
    expect(formatMedicationsList(meds)).toBe(
      'Metformin - 500mg - Twice daily, Lisinopril - 10mg - Once daily'
    )
  })

  it('handles medication objects with only name', () => {
    const meds = [{ name: 'Metformin' }, { name: 'Lisinopril' }]
    expect(formatMedicationsList(meds)).toBe('Metformin, Lisinopril')
  })

  it('handles string arrays', () => {
    const meds = ['Metformin', 'Lisinopril']
    expect(formatMedicationsList(meds)).toBe('Metformin, Lisinopril')
  })

  it('handles a plain string', () => {
    expect(formatMedicationsList('Metformin 500mg')).toBe('Metformin 500mg')
  })

  it('returns undefined for empty array', () => {
    expect(formatMedicationsList([])).toBeUndefined()
  })

  it('returns undefined for null/undefined', () => {
    expect(formatMedicationsList(null)).toBeUndefined()
    expect(formatMedicationsList(undefined)).toBeUndefined()
  })

  it('handles mixed string and object array', () => {
    const meds = ['Aspirin', { name: 'Metformin', dosage: '500mg' }]
    expect(formatMedicationsList(meds)).toBe('Aspirin, Metformin - 500mg')
  })
})

describe('buildPartnerNote', () => {
  it('includes all treatment preference fields', () => {
    const body = {
      treatmentPreferences: {
        preferredContactMethod: 'email',
        bestTimeToContact: 'morning',
        pharmacyPreference: 'CVS on Main Street',
        customSolution: true,
        additionalNotes: 'I have questions about dosing',
      },
    }

    const note = buildPartnerNote(body)
    expect(note).toContain('--- TREATMENT PREFERENCES ---')
    expect(note).toContain('Preferred contact: email')
    expect(note).toContain('Best time to contact: morning')
    expect(note).toContain('Pharmacy preference: CVS on Main Street')
    expect(note).toContain('Custom solution requested: Yes')
    expect(note).toContain('Patient notes: I have questions about dosing')
  })

  it('includes current medications with dosage and frequency', () => {
    const body = {
      currentMedications: [
        { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' },
        { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
      ],
    }

    const note = buildPartnerNote(body)
    expect(note).toContain('--- CURRENT MEDICATIONS ---')
    expect(note).toContain('1. Metformin - 500mg - Twice daily')
    expect(note).toContain('2. Lisinopril - 10mg - Once daily')
  })

  it('includes plan tier', () => {
    const body = { planTier: 'catalyst' }
    const note = buildPartnerNote(body)
    expect(note).toContain('--- PLAN ---')
    expect(note).toContain('CULTR Plan: catalyst')
  })

  it('handles missing optional fields gracefully', () => {
    const body = {
      treatmentPreferences: {
        preferredContactMethod: 'phone',
      },
    }

    const note = buildPartnerNote(body)
    expect(note).toContain('Preferred contact: phone')
    expect(note).not.toContain('Best time to contact')
    expect(note).not.toContain('Pharmacy preference')
    expect(note).not.toContain('Patient notes')
  })

  it('returns empty string when no data', () => {
    expect(buildPartnerNote({})).toBe('')
  })

  it('handles customSolution = false', () => {
    const body = {
      treatmentPreferences: { customSolution: false },
    }
    const note = buildPartnerNote(body)
    expect(note).toContain('Custom solution requested: No')
  })

  it('builds full note with all sections', () => {
    const body = {
      treatmentPreferences: {
        preferredContactMethod: 'email',
        bestTimeToContact: 'morning',
        pharmacyPreference: 'CVS',
        customSolution: true,
        additionalNotes: 'Test note',
      },
      currentMedications: [
        { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' },
      ],
      planTier: 'core',
    }

    const note = buildPartnerNote(body)
    // All three sections present
    expect(note).toContain('--- TREATMENT PREFERENCES ---')
    expect(note).toContain('--- CURRENT MEDICATIONS ---')
    expect(note).toContain('--- PLAN ---')
    // Sections separated by blank lines
    expect(note).toContain('\n\n')
  })
})
