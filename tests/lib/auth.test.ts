import { describe, it, expect } from 'vitest'
import {
  getLibraryAccess,
  hasFeatureAccess,
  isProviderEmail,
} from '@/lib/auth'
import type { PlanTier, LibraryAccess } from '@/lib/config/plans'

describe('Library Access', () => {
  describe('getLibraryAccess', () => {
    it('returns titles-only master index for Core tier', () => {
      const access = getLibraryAccess('core')
      expect(access.masterIndex).toBe('titles_only')
      expect(access.advancedProtocols).toBe(false)
      expect(access.dosingCalculators).toBe(false)
      expect(access.stackingGuides).toBe(false)
      expect(access.providerNotes).toBe(false)
      expect(access.customRequests).toBe(false)
    })

    it('returns full access for Creator tier', () => {
      const access = getLibraryAccess('creator')
      expect(access.masterIndex).toBe('full')
      expect(access.advancedProtocols).toBe(true)
      expect(access.dosingCalculators).toBe(false)
      expect(access.stackingGuides).toBe(false)
      expect(access.providerNotes).toBe(false)
      expect(access.customRequests).toBe(false)
    })

    it('returns dosing calculators and stacking guides for Catalyst+ tier', () => {
      const access = getLibraryAccess('catalyst')
      expect(access.masterIndex).toBe('full')
      expect(access.advancedProtocols).toBe(true)
      expect(access.dosingCalculators).toBe(true)
      expect(access.stackingGuides).toBe(true)
      expect(access.providerNotes).toBe(false)
      expect(access.customRequests).toBe(false)
    })

    it('returns provider notes for Concierge tier', () => {
      const access = getLibraryAccess('concierge')
      expect(access.masterIndex).toBe('full')
      expect(access.advancedProtocols).toBe(true)
      expect(access.dosingCalculators).toBe(true)
      expect(access.stackingGuides).toBe(true)
      expect(access.providerNotes).toBe(true)
      expect(access.customRequests).toBe(false)
    })

    it('returns full access including custom requests for Club tier', () => {
      const access = getLibraryAccess('club')
      expect(access.masterIndex).toBe('full')
      expect(access.advancedProtocols).toBe(true)
      expect(access.dosingCalculators).toBe(true)
      expect(access.stackingGuides).toBe(true)
      expect(access.providerNotes).toBe(true)
      expect(access.customRequests).toBe(true)
    })

    it('defaults to Core access for null tier', () => {
      const access = getLibraryAccess(null)
      expect(access.masterIndex).toBe('titles_only')
      expect(access.advancedProtocols).toBe(false)
    })

    it('defaults to Core access for undefined tier', () => {
      const access = getLibraryAccess(undefined)
      expect(access.masterIndex).toBe('titles_only')
      expect(access.advancedProtocols).toBe(false)
    })

    // Test legacy tier name aliases
    it('normalizes legacy "starter" to "core"', () => {
      const access = getLibraryAccess('starter' as PlanTier)
      expect(access.masterIndex).toBe('titles_only')
    })

    it('normalizes legacy "cognition" to "catalyst"', () => {
      const access = getLibraryAccess('cognition' as PlanTier)
      expect(access.dosingCalculators).toBe(true)
      expect(access.stackingGuides).toBe(true)
    })

    it('normalizes legacy "confidante" to "concierge"', () => {
      const access = getLibraryAccess('confidante' as PlanTier)
      expect(access.providerNotes).toBe(true)
    })
  })

  describe('hasFeatureAccess', () => {
    it('returns false for masterIndex on Core (titles_only)', () => {
      expect(hasFeatureAccess('core', 'masterIndex')).toBe(false)
    })

    it('returns true for masterIndex on Creator (full)', () => {
      expect(hasFeatureAccess('creator', 'masterIndex')).toBe(true)
    })

    it('returns false for advancedProtocols on Core', () => {
      expect(hasFeatureAccess('core', 'advancedProtocols')).toBe(false)
    })

    it('returns true for advancedProtocols on Creator', () => {
      expect(hasFeatureAccess('creator', 'advancedProtocols')).toBe(true)
    })

    it('returns false for dosingCalculators on Creator', () => {
      expect(hasFeatureAccess('creator', 'dosingCalculators')).toBe(false)
    })

    it('returns true for dosingCalculators on Catalyst+', () => {
      expect(hasFeatureAccess('catalyst', 'dosingCalculators')).toBe(true)
    })

    it('returns false for providerNotes on Catalyst+', () => {
      expect(hasFeatureAccess('catalyst', 'providerNotes')).toBe(false)
    })

    it('returns true for providerNotes on Concierge', () => {
      expect(hasFeatureAccess('concierge', 'providerNotes')).toBe(true)
    })

    it('returns false for customRequests on Concierge', () => {
      expect(hasFeatureAccess('concierge', 'customRequests')).toBe(false)
    })

    it('returns true for customRequests on Club', () => {
      expect(hasFeatureAccess('club', 'customRequests')).toBe(true)
    })
  })
})

describe('Provider Email Access', () => {
  describe('isProviderEmail', () => {
    it('returns true for allowed emails', () => {
      expect(isProviderEmail('provider@cultrhealth.com')).toBe(true)
      expect(isProviderEmail('admin@cultrhealth.com')).toBe(true)
    })

    it('is case insensitive', () => {
      expect(isProviderEmail('PROVIDER@CULTRHEALTH.COM')).toBe(true)
      expect(isProviderEmail('Provider@CultrHealth.com')).toBe(true)
    })

    it('returns false for non-allowed emails', () => {
      expect(isProviderEmail('random@example.com')).toBe(false)
      expect(isProviderEmail('patient@cultrhealth.com')).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isProviderEmail('')).toBe(false)
    })
  })
})
