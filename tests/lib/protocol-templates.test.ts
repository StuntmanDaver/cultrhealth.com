import { describe, it, expect } from 'vitest'
import {
  PROTOCOL_TEMPLATES,
  getProtocolTemplate,
  generateProtocol,
  SYMPTOM_PROTOCOLS,
  getSymptomProtocol,
  searchSymptoms,
  getSymptomsByCategory,
  getAllSupplements,
  getAllPeptides,
  findSymptomsByIntervention,
  generateCombinedProtocol,
  getSynergisticSymptoms,
  getSymptomCategoryCounts,
} from '@/lib/protocol-templates'

describe('Protocol Templates', () => {
  describe('PROTOCOL_TEMPLATES', () => {
    it('contains expected templates', () => {
      expect(PROTOCOL_TEMPLATES.length).toBeGreaterThanOrEqual(5)
      
      const templateIds = PROTOCOL_TEMPLATES.map((t) => t.id)
      expect(templateIds).toContain('glp1-standard')
      expect(templateIds).toContain('glp1-muscle-retention')
      expect(templateIds).toContain('cognitive-enhancement')
      expect(templateIds).toContain('recovery-repair')
      expect(templateIds).toContain('longevity-anti-aging')
    })

    it('each template has required fields', () => {
      for (const template of PROTOCOL_TEMPLATES) {
        expect(template.id).toBeTruthy()
        expect(template.name).toBeTruthy()
        expect(template.category).toBeTruthy()
        expect(template.description).toBeTruthy()
        expect(template.defaultDuration).toBeGreaterThan(0)
        expect(template.phases.length).toBeGreaterThan(0)
        expect(template.monitoringSchedule.length).toBeGreaterThan(0)
        expect(Array.isArray(template.contraindications)).toBe(true)
        expect(Array.isArray(template.documents)).toBe(true)
      }
    })

    it('each template has valid phases', () => {
      for (const template of PROTOCOL_TEMPLATES) {
        for (const phase of template.phases) {
          expect(phase.name).toBeTruthy()
          expect(phase.weekStart).toBeGreaterThan(0)
          expect(phase.weekEnd).toBeGreaterThanOrEqual(phase.weekStart)
          expect(phase.instructions).toBeTruthy()
        }
      }
    })
  })

  describe('getProtocolTemplate', () => {
    it('returns template for valid ID', () => {
      const template = getProtocolTemplate('glp1-standard')
      expect(template).not.toBeNull()
      expect(template?.id).toBe('glp1-standard')
      expect(template?.name).toBe('GLP-1 Standard Protocol')
    })

    it('returns null for invalid ID', () => {
      const template = getProtocolTemplate('non-existent-template')
      expect(template).toBeNull()
    })

    it('returns null for empty string', () => {
      const template = getProtocolTemplate('')
      expect(template).toBeNull()
    })
  })

  describe('generateProtocol', () => {
    it('generates protocol with default parameters', () => {
      const protocol = generateProtocol('glp1-standard', {})
      
      expect(protocol).not.toBeNull()
      expect(protocol?.templateId).toBe('glp1-standard')
      expect(protocol?.name).toBe('GLP-1 Standard Protocol')
      expect(protocol?.summary).toContain('GLP-1 Standard Protocol')
      expect(protocol?.phases.length).toBeGreaterThan(0)
    })

    it('applies custom parameters to instructions', () => {
      const protocol = generateProtocol('glp1-standard', {
        startingDose: 0.5,
        targetDose: 2.0,
      })
      
      expect(protocol).not.toBeNull()
      expect(protocol?.parameters.startingDose).toBe(0.5)
      expect(protocol?.parameters.targetDose).toBe(2.0)
      
      // Check that parameters are interpolated in instructions
      const titrationPhase = protocol?.phases.find((p) => p.name === 'Titration')
      expect(titrationPhase?.instructions).toContain('0.5')
    })

    it('returns null for invalid template ID', () => {
      const protocol = generateProtocol('invalid-template', {})
      expect(protocol).toBeNull()
    })

    it('uses default values for missing parameters', () => {
      const protocol = generateProtocol('glp1-standard', {
        startingDose: 0.3,
        // targetDose not provided, should use default
      })
      
      expect(protocol).not.toBeNull()
      expect(protocol?.parameters.startingDose).toBe(0.3)
      expect(protocol?.parameters.targetDose).toBe(1.0) // default
    })

    it('generates documents with interpolated parameters', () => {
      const protocol = generateProtocol('glp1-standard', {
        startingDose: 0.25,
        targetDose: 1.5,
      })
      
      expect(protocol).not.toBeNull()
      expect(protocol?.documents.length).toBeGreaterThan(0)
      
      const doc = protocol?.documents[0]
      expect(doc?.title).toBeTruthy()
      expect(doc?.content).toContain('0.25')
      expect(doc?.content).toContain('1.5')
    })

    it('generates monitoring schedule', () => {
      const protocol = generateProtocol('glp1-standard', {})
      
      expect(protocol).not.toBeNull()
      expect(protocol?.monitoringSchedule.length).toBeGreaterThan(0)
      
      const weightMonitoring = protocol?.monitoringSchedule.find((m) =>
        m.label.toLowerCase().includes('weight')
      )
      expect(weightMonitoring).toBeTruthy()
    })
  })

  describe('Protocol Categories', () => {
    it('has metabolic protocols', () => {
      const metabolicProtocols = PROTOCOL_TEMPLATES.filter((t) => t.category === 'metabolic')
      expect(metabolicProtocols.length).toBeGreaterThanOrEqual(2)
    })

    it('has cognitive protocols', () => {
      const cognitiveProtocols = PROTOCOL_TEMPLATES.filter((t) => t.category === 'cognitive')
      expect(cognitiveProtocols.length).toBeGreaterThanOrEqual(1)
    })

    it('has repair protocols', () => {
      const repairProtocols = PROTOCOL_TEMPLATES.filter((t) => t.category === 'repair')
      expect(repairProtocols.length).toBeGreaterThanOrEqual(1)
    })

    it('has longevity protocols', () => {
      const longevityProtocols = PROTOCOL_TEMPLATES.filter((t) => t.category === 'longevity')
      expect(longevityProtocols.length).toBeGreaterThanOrEqual(1)
    })
  })
})

// ============================================================================
// SYMPTOM PROTOCOL TESTS
// ============================================================================

describe('Symptom Protocols', () => {
  describe('SYMPTOM_PROTOCOLS data', () => {
    it('contains 100+ symptom protocols', () => {
      expect(SYMPTOM_PROTOCOLS.length).toBeGreaterThanOrEqual(100)
    })

    it('each protocol has required fields', () => {
      for (const protocol of SYMPTOM_PROTOCOLS) {
        expect(protocol.id).toBeTruthy()
        expect(protocol.symptom).toBeTruthy()
        expect(protocol.category).toBeTruthy()
        expect(protocol.supplements.length).toBeGreaterThanOrEqual(3)
        expect(protocol.peptide).toBeTruthy()
        expect(protocol.interventions.length).toBeGreaterThanOrEqual(4)
        expect(protocol.monitoring.length).toBeGreaterThan(0)
      }
    })

    it('each intervention has required fields', () => {
      for (const protocol of SYMPTOM_PROTOCOLS) {
        for (const intervention of protocol.interventions) {
          expect(intervention.name).toBeTruthy()
          expect(['supplement', 'peptide']).toContain(intervention.type)
        }
      }
    })

    it('covers all symptom categories', () => {
      const categories = new Set(SYMPTOM_PROTOCOLS.map((p) => p.category))
      expect(categories.has('mental')).toBe(true)
      expect(categories.has('energy')).toBe(true)
      expect(categories.has('physical')).toBe(true)
      expect(categories.has('skin')).toBe(true)
      expect(categories.has('digestive')).toBe(true)
      expect(categories.has('immune')).toBe(true)
      expect(categories.has('neurological')).toBe(true)
      expect(categories.has('metabolic')).toBe(true)
      expect(categories.has('cardiovascular')).toBe(true)
      expect(categories.has('hormonal')).toBe(true)
    })
  })

  describe('getSymptomProtocol', () => {
    it('returns protocol for valid ID', () => {
      const protocol = getSymptomProtocol('anxiety')
      expect(protocol).not.toBeNull()
      expect(protocol?.symptom).toBe('Anxiety')
      expect(protocol?.peptide).toBe('Selank')
    })

    it('returns null for invalid ID', () => {
      expect(getSymptomProtocol('non-existent')).toBeNull()
    })

    it('returns correct interventions for insomnia', () => {
      const protocol = getSymptomProtocol('insomnia')
      expect(protocol?.supplements).toContain('Glycine')
      expect(protocol?.supplements).toContain('Magnesium threonate')
      expect(protocol?.supplements).toContain('L-theanine')
      expect(protocol?.peptide).toBe('DSIP')
    })

    it('returns correct interventions for depression', () => {
      const protocol = getSymptomProtocol('depression')
      expect(protocol?.supplements).toContain('Vitamin D')
      expect(protocol?.supplements).toContain('Omega-3')
      expect(protocol?.supplements).toContain('Methylfolate')
      expect(protocol?.peptide).toBe('Selank')
    })
  })

  describe('searchSymptoms', () => {
    it('finds symptoms by partial match', () => {
      const results = searchSymptoms('fat')
      expect(results.length).toBeGreaterThan(0)
      expect(results.some((r) => r.symptom.toLowerCase().includes('fat'))).toBe(true)
    })

    it('is case insensitive', () => {
      const lower = searchSymptoms('anxiety')
      const upper = searchSymptoms('ANXIETY')
      expect(lower.length).toBe(upper.length)
    })

    it('returns empty array for no matches', () => {
      const results = searchSymptoms('xyznonexistent')
      expect(results).toHaveLength(0)
    })
  })

  describe('getSymptomsByCategory', () => {
    it('returns mental health symptoms', () => {
      const mental = getSymptomsByCategory('mental')
      expect(mental.length).toBeGreaterThanOrEqual(10)
      expect(mental.some((p) => p.id === 'anxiety')).toBe(true)
      expect(mental.some((p) => p.id === 'depression')).toBe(true)
    })

    it('returns digestive symptoms', () => {
      const digestive = getSymptomsByCategory('digestive')
      expect(digestive.length).toBeGreaterThanOrEqual(10)
      expect(digestive.some((p) => p.id === 'bloating')).toBe(true)
      expect(digestive.some((p) => p.id === 'constipation')).toBe(true)
    })

    it('returns hormonal symptoms', () => {
      const hormonal = getSymptomsByCategory('hormonal')
      expect(hormonal.length).toBeGreaterThanOrEqual(10)
      expect(hormonal.some((p) => p.id === 'low-libido')).toBe(true)
      expect(hormonal.some((p) => p.id === 'pms')).toBe(true)
    })
  })

  describe('getAllSupplements', () => {
    it('returns comprehensive supplement list', () => {
      const supplements = getAllSupplements()
      expect(supplements.length).toBeGreaterThan(30)
      expect(supplements).toContain('Magnesium')
      expect(supplements).toContain('Vitamin D')
      expect(supplements).toContain('Omega-3')
      expect(supplements).toContain('Zinc')
    })

    it('returns sorted list', () => {
      const supplements = getAllSupplements()
      const sorted = [...supplements].sort()
      expect(supplements).toEqual(sorted)
    })
  })

  describe('getAllPeptides', () => {
    it('returns all unique peptides', () => {
      const peptides = getAllPeptides()
      expect(peptides.length).toBeGreaterThanOrEqual(10)
      expect(peptides).toContain('Selank')
      expect(peptides).toContain('Semax')
      expect(peptides).toContain('BPC-157')
      expect(peptides).toContain('TB-500')
      expect(peptides).toContain('DSIP')
      expect(peptides).toContain('GHK-Cu')
      expect(peptides).toContain('Thymosin Alpha-1')
      expect(peptides).toContain('MOTS-c')
      expect(peptides).toContain('NAD+')
      expect(peptides).toContain('PT-141')
    })
  })

  describe('findSymptomsByIntervention', () => {
    it('finds symptoms using magnesium', () => {
      const results = findSymptomsByIntervention('Magnesium')
      expect(results.length).toBeGreaterThan(50)
    })

    it('finds symptoms using Selank peptide', () => {
      const results = findSymptomsByIntervention('Selank')
      expect(results.length).toBeGreaterThan(5)
      expect(results.some((r) => r.id === 'anxiety')).toBe(true)
    })

    it('finds symptoms using BPC-157 peptide', () => {
      const results = findSymptomsByIntervention('BPC-157')
      expect(results.length).toBeGreaterThan(10)
    })
  })

  describe('generateCombinedProtocol', () => {
    it('generates combined protocol for multiple symptoms', () => {
      const combined = generateCombinedProtocol(['anxiety', 'insomnia'])
      expect(combined).not.toBeNull()
      expect(combined?.symptoms).toContain('Anxiety')
      expect(combined?.symptoms).toContain('Insomnia')
      expect(combined?.interventions.length).toBeGreaterThan(0)
    })

    it('prioritizes shared interventions', () => {
      const combined = generateCombinedProtocol(['anxiety', 'panic-attacks', 'social-anxiety'])
      expect(combined).not.toBeNull()
      
      // Magnesium and Selank should appear with high frequency
      const magnesium = combined?.interventions.find((i) => i.name.includes('Magnesium'))
      expect(magnesium?.frequency).toBeGreaterThanOrEqual(2)
      
      const selank = combined?.interventions.find((i) => i.name === 'Selank')
      expect(selank?.frequency).toBe(3)
    })

    it('aggregates monitoring items', () => {
      const combined = generateCombinedProtocol(['anxiety', 'depression'])
      expect(combined?.monitoring.length).toBeGreaterThan(0)
    })

    it('aggregates contraindications', () => {
      const combined = generateCombinedProtocol(['depression', 'weak-workouts'])
      expect(combined?.contraindications.length).toBeGreaterThan(0)
    })

    it('returns null for empty or invalid IDs', () => {
      expect(generateCombinedProtocol([])).toBeNull()
      expect(generateCombinedProtocol(['nonexistent1', 'nonexistent2'])).toBeNull()
    })
  })

  describe('getSynergisticSymptoms', () => {
    it('returns related symptoms for anxiety', () => {
      const synergies = getSynergisticSymptoms('anxiety')
      expect(synergies.length).toBeGreaterThan(0)
      expect(synergies.some((s) => s.id === 'panic-attacks')).toBe(true)
    })

    it('returns related symptoms for chronic-fatigue', () => {
      const synergies = getSynergisticSymptoms('chronic-fatigue')
      expect(synergies.some((s) => s.id === 'low-stamina' || s.id === 'mental-fatigue')).toBe(true)
    })

    it('returns empty array for symptoms without synergies', () => {
      const result = getSynergisticSymptoms('nonexistent')
      expect(result).toHaveLength(0)
    })
  })

  describe('getSymptomCategoryCounts', () => {
    it('returns counts for all categories', () => {
      const counts = getSymptomCategoryCounts()
      expect(counts.mental).toBeGreaterThan(0)
      expect(counts.energy).toBeGreaterThan(0)
      expect(counts.physical).toBeGreaterThan(0)
      expect(counts.skin).toBeGreaterThan(0)
      expect(counts.digestive).toBeGreaterThan(0)
      expect(counts.immune).toBeGreaterThan(0)
      expect(counts.neurological).toBeGreaterThan(0)
      expect(counts.metabolic).toBeGreaterThan(0)
      expect(counts.cardiovascular).toBeGreaterThan(0)
      expect(counts.hormonal).toBeGreaterThan(0)
    })

    it('total counts match SYMPTOM_PROTOCOLS length', () => {
      const counts = getSymptomCategoryCounts()
      const total = Object.values(counts).reduce((sum, count) => sum + count, 0)
      expect(total).toBe(SYMPTOM_PROTOCOLS.length)
    })
  })

  describe('Specific symptom-intervention mappings', () => {
    const testCases = [
      { id: 'anxiety', supplements: ['Magnesium glycinate', 'Vitamin B6', 'Omega-3'], peptide: 'Selank' },
      { id: 'insomnia', supplements: ['Glycine', 'Magnesium threonate', 'L-theanine'], peptide: 'DSIP' },
      { id: 'brain-fog', supplements: ['Thiamine B1', 'Choline', 'Omega-3'], peptide: 'Semax' },
      { id: 'low-libido', supplements: ['Zinc', 'Boron', 'Vitamin D'], peptide: 'PT-141' },
      { id: 'pms', supplements: ['Vitamin B6', 'Magnesium', 'Calcium'], peptide: 'Oxytocin' },
      { id: 'constipation', supplements: ['Magnesium citrate', 'Vitamin C', 'PHGG fiber'], peptide: 'BPC-157' },
      { id: 'hair-thinning', supplements: ['Iron', 'Zinc', 'Biotin'], peptide: 'GHK-Cu' },
      { id: 'insulin-resistance', supplements: ['Chromium', 'Magnesium', 'Alpha lipoic acid'], peptide: 'RTA' },
      { id: 'frequent-colds', supplements: ['Vitamin D', 'Zinc', 'Vitamin C'], peptide: 'Thymosin Alpha-1' },
      { id: 'muscle-cramps', supplements: ['Magnesium', 'Potassium', 'Sodium'], peptide: 'TB-500' },
    ]

    for (const tc of testCases) {
      it(`${tc.id} has correct interventions`, () => {
        const protocol = getSymptomProtocol(tc.id)
        expect(protocol).not.toBeNull()
        expect(protocol?.peptide).toBe(tc.peptide)
        for (const supp of tc.supplements) {
          expect(protocol?.supplements).toContain(supp)
        }
      })
    }
  })
})
