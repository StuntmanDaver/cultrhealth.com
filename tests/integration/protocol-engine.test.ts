import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getLibraryAccess, hasFeatureAccess } from '@/lib/auth'
import { generateProtocol, getProtocolTemplate } from '@/lib/protocol-templates'
import type { PlanTier, LibraryAccess } from '@/lib/config/plans'

/**
 * Integration tests for the Protocol Engine
 * Tests the complete flow from tier access to protocol generation
 */
describe('Protocol Engine Integration', () => {
  describe('Tier → Library Access Flow', () => {
    const tiers: PlanTier[] = ['club', 'core', 'catalyst', 'concierge']

    it('each tier has progressively more access', () => {
      let previousFeatureCount = 0

      for (const tier of tiers) {
        const access = getLibraryAccess(tier)
        const featureCount = [
          access.masterIndex === 'full',
          access.advancedProtocols,
          access.dosingCalculators,
          access.stackingGuides,
          access.providerNotes,
          access.customRequests,
        ].filter(Boolean).length

        expect(featureCount).toBeGreaterThanOrEqual(previousFeatureCount)
        previousFeatureCount = featureCount
      }
    })

    it('Concierge tier has the most features', () => {
      const access = getLibraryAccess('concierge')
      expect(access.masterIndex).toBe('full')
      expect(access.advancedProtocols).toBe(true)
      expect(access.dosingCalculators).toBe(true)
      expect(access.stackingGuides).toBe(true)
      expect(access.providerNotes).toBe(true)
    })

    it('Club tier is free with limited access (no shop, no provider features)', () => {
      const access = getLibraryAccess('club')
      expect(access.masterIndex).toBe('full')
      expect(access.advancedProtocols).toBe(false)
      expect(access.dosingCalculators).toBe(true)
      expect(access.stackingGuides).toBe(true)
      expect(access.providerNotes).toBe(false)
      expect(access.customRequests).toBe(false)
    })

    it('Core tier has shop access but not provider features', () => {
      const access = getLibraryAccess('core')
      expect(access.masterIndex).toBe('full')
      expect(access.advancedProtocols).toBe(true)
      expect(access.dosingCalculators).toBe(true)
      expect(access.stackingGuides).toBe(true)
      expect(access.providerNotes).toBe(false)
      expect(access.customRequests).toBe(false)
    })
  })

  describe('Protocol Template → Generation Flow', () => {
    it('generates valid protocol from GLP-1 Standard template', () => {
      const template = getProtocolTemplate('glp1-standard')
      expect(template).not.toBeNull()

      const protocol = generateProtocol('glp1-standard', {
        startingDose: 0.25,
        targetDose: 1.0,
        titrationWeeks: 4,
      })

      expect(protocol).not.toBeNull()
      expect(protocol?.templateId).toBe('glp1-standard')
      expect(protocol?.phases.length).toBe(2)
      expect(protocol?.documents.length).toBeGreaterThan(0)
    })

    it('generates valid protocol from Muscle Retention template', () => {
      const protocol = generateProtocol('glp1-muscle-retention', {
        proteinTarget: 150,
        resistanceDays: 4,
      })

      expect(protocol).not.toBeNull()
      expect(protocol?.parameters.proteinTarget).toBe(150)
      expect(protocol?.parameters.resistanceDays).toBe(4)
    })

    it('generates valid protocol from Cognitive Enhancement template', () => {
      const protocol = generateProtocol('cognitive-enhancement', {
        sleepTarget: 8,
      })

      expect(protocol).not.toBeNull()
      expect(protocol?.parameters.sleepTarget).toBe(8)
    })

    it('generates valid protocol from Recovery template', () => {
      const protocol = generateProtocol('recovery-repair', {
        acuteWeeks: 3,
      })

      expect(protocol).not.toBeNull()
      expect(protocol?.parameters.acuteWeeks).toBe(3)
    })

    it('generates valid protocol from Longevity template', () => {
      const protocol = generateProtocol('longevity-anti-aging', {
        labCadence: 'monthly',
      })

      expect(protocol).not.toBeNull()
      expect(protocol?.parameters.labCadence).toBe('monthly')
    })
  })

  describe('Protocol Content Interpolation', () => {
    it('interpolates all parameters in phase instructions', () => {
      const protocol = generateProtocol('glp1-standard', {
        startingDose: 0.5,
        targetDose: 2.0,
        titrationWeeks: 6,
      })

      expect(protocol).not.toBeNull()

      // Check that parameters are interpolated (no remaining {{...}} placeholders)
      for (const phase of protocol?.phases || []) {
        expect(phase.instructions).not.toMatch(/\{\{.*?\}\}/)
        // Check that our values appear
        if (phase.name === 'Titration') {
          expect(phase.instructions).toContain('0.5')
          expect(phase.instructions).toContain('6')
        }
      }
    })

    it('interpolates parameters in document content', () => {
      const protocol = generateProtocol('glp1-standard', {
        startingDose: 0.25,
        targetDose: 1.5,
      })

      expect(protocol).not.toBeNull()

      for (const doc of protocol?.documents || []) {
        expect(doc.content).not.toMatch(/\{\{.*?\}\}/)
        expect(doc.content).toContain('0.25')
        expect(doc.content).toContain('1.5')
      }
    })

    it('interpolates parameters in monitoring schedule', () => {
      const protocol = generateProtocol('longevity-anti-aging', {
        labCadence: 'quarterly',
      })

      expect(protocol).not.toBeNull()

      const labMonitoring = protocol?.monitoringSchedule.find((m) =>
        m.label.toLowerCase().includes('lab')
      )
      expect(labMonitoring?.cadence).toContain('quarterly')
    })
  })

  describe('Feature Access → Content Gating', () => {
    it('Club cannot access advanced protocols (shop)', () => {
      expect(hasFeatureAccess('club', 'advancedProtocols')).toBe(false)
    })

    it('Core can access advanced protocols (shop)', () => {
      expect(hasFeatureAccess('core', 'advancedProtocols')).toBe(true)
    })

    it('Club can access dosing calculators', () => {
      expect(hasFeatureAccess('club', 'dosingCalculators')).toBe(true)
    })

    it('Catalyst+ cannot access provider notes', () => {
      expect(hasFeatureAccess('catalyst', 'providerNotes')).toBe(false)
    })

    it('Concierge can access provider notes', () => {
      expect(hasFeatureAccess('concierge', 'providerNotes')).toBe(true)
    })

    it('Concierge cannot access custom requests', () => {
      expect(hasFeatureAccess('concierge', 'customRequests')).toBe(false)
    })

    it('Club cannot access custom requests', () => {
      expect(hasFeatureAccess('club', 'customRequests')).toBe(false)
    })
  })

  describe('Legacy Tier Normalization', () => {
    it('normalizes starter to core', () => {
      const access = getLibraryAccess('starter' as PlanTier)
      const coreAccess = getLibraryAccess('core')
      expect(access).toEqual(coreAccess)
    })

    it('normalizes cognition to catalyst', () => {
      const access = getLibraryAccess('cognition' as PlanTier)
      const catalystAccess = getLibraryAccess('catalyst')
      expect(access).toEqual(catalystAccess)
    })

    it('normalizes confidante to concierge', () => {
      const access = getLibraryAccess('confidante' as PlanTier)
      const conciergeAccess = getLibraryAccess('concierge')
      expect(access).toEqual(conciergeAccess)
    })
  })

  describe('Protocol Template Validation', () => {
    it('all templates have valid categories', () => {
      const validCategories = ['metabolic', 'cognitive', 'repair', 'longevity']
      const templates = [
        'glp1-standard',
        'glp1-muscle-retention',
        'cognitive-enhancement',
        'recovery-repair',
        'longevity-anti-aging',
      ]

      for (const templateId of templates) {
        const template = getProtocolTemplate(templateId)
        expect(template).not.toBeNull()
        expect(validCategories).toContain(template?.category)
      }
    })

    it('all templates have non-empty phases', () => {
      const templates = [
        'glp1-standard',
        'glp1-muscle-retention',
        'cognitive-enhancement',
        'recovery-repair',
        'longevity-anti-aging',
      ]

      for (const templateId of templates) {
        const template = getProtocolTemplate(templateId)
        expect(template?.phases.length).toBeGreaterThan(0)
      }
    })

    it('all templates have monitoring schedules', () => {
      const templates = [
        'glp1-standard',
        'glp1-muscle-retention',
        'cognitive-enhancement',
        'recovery-repair',
        'longevity-anti-aging',
      ]

      for (const templateId of templates) {
        const template = getProtocolTemplate(templateId)
        expect(template?.monitoringSchedule.length).toBeGreaterThan(0)
      }
    })
  })
})
