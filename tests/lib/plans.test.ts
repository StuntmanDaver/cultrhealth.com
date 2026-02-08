import { describe, it, expect } from 'vitest'
import { PLANS, STRIPE_CONFIG } from '@/lib/config/plans'
import type { PlanTier, LibraryAccess } from '@/lib/config/plans'

describe('Plans Configuration', () => {
  describe('PLANS array', () => {
    it('contains 5 tiers', () => {
      expect(PLANS).toHaveLength(5)
    })

    it('has expected tier slugs', () => {
      const slugs = PLANS.map((p) => p.slug)
      expect(slugs).toContain('core')
      expect(slugs).toContain('creator')
      expect(slugs).toContain('catalyst')
      expect(slugs).toContain('concierge')
      expect(slugs).toContain('club')
    })

    it('has ascending prices', () => {
      const prices = PLANS.map((p) => p.price)
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThan(prices[i - 1])
      }
    })

    it('each plan has required fields', () => {
      for (const plan of PLANS) {
        expect(plan.slug).toBeTruthy()
        expect(plan.name).toBeTruthy()
        expect(plan.price).toBeGreaterThan(0)
        expect(plan.interval).toBe('month')
        expect(plan.tagline).toBeTruthy()
        expect(plan.features.length).toBeGreaterThan(0)
        expect(plan.stripeProductId).toBeTruthy()
        expect(plan.stripePriceId).toBeTruthy()
        expect(plan.paymentLink).toBeTruthy()
        expect(plan.ctaLabel).toBeTruthy()
        expect(plan.libraryAccess).toBeDefined()
      }
    })

    it('Catalyst+ is marked as featured', () => {
      const catalyst = PLANS.find((p) => p.slug === 'catalyst')
      expect(catalyst?.isFeatured).toBe(true)
    })
  })

  describe('Library Access Configuration', () => {
    const getPlanAccess = (slug: string): LibraryAccess | undefined => {
      return PLANS.find((p) => p.slug === slug)?.libraryAccess
    }

    describe('Core tier ($99)', () => {
      it('has titles-only master index', () => {
        const access = getPlanAccess('core')
        expect(access?.masterIndex).toBe('titles_only')
      })

      it('does not have advanced protocols', () => {
        const access = getPlanAccess('core')
        expect(access?.advancedProtocols).toBe(false)
      })

      it('does not have dosing calculators', () => {
        const access = getPlanAccess('core')
        expect(access?.dosingCalculators).toBe(false)
      })

      it('does not have stacking guides', () => {
        const access = getPlanAccess('core')
        expect(access?.stackingGuides).toBe(false)
      })

      it('does not have provider notes', () => {
        const access = getPlanAccess('core')
        expect(access?.providerNotes).toBe(false)
      })

      it('does not have custom requests', () => {
        const access = getPlanAccess('core')
        expect(access?.customRequests).toBe(false)
      })
    })

    describe('Creator tier ($149)', () => {
      it('has full master index', () => {
        const access = getPlanAccess('creator')
        expect(access?.masterIndex).toBe('full')
      })

      it('has advanced protocols', () => {
        const access = getPlanAccess('creator')
        expect(access?.advancedProtocols).toBe(true)
      })

      it('does not have dosing calculators', () => {
        const access = getPlanAccess('creator')
        expect(access?.dosingCalculators).toBe(false)
      })

      it('does not have stacking guides', () => {
        const access = getPlanAccess('creator')
        expect(access?.stackingGuides).toBe(false)
      })
    })

    describe('Catalyst+ tier ($199)', () => {
      it('has full master index', () => {
        const access = getPlanAccess('catalyst')
        expect(access?.masterIndex).toBe('full')
      })

      it('has advanced protocols', () => {
        const access = getPlanAccess('catalyst')
        expect(access?.advancedProtocols).toBe(true)
      })

      it('has dosing calculators', () => {
        const access = getPlanAccess('catalyst')
        expect(access?.dosingCalculators).toBe(true)
      })

      it('has stacking guides', () => {
        const access = getPlanAccess('catalyst')
        expect(access?.stackingGuides).toBe(true)
      })

      it('does not have provider notes', () => {
        const access = getPlanAccess('catalyst')
        expect(access?.providerNotes).toBe(false)
      })
    })

    describe('Concierge tier ($299)', () => {
      it('has all Catalyst+ features', () => {
        const access = getPlanAccess('concierge')
        expect(access?.masterIndex).toBe('full')
        expect(access?.advancedProtocols).toBe(true)
        expect(access?.dosingCalculators).toBe(true)
        expect(access?.stackingGuides).toBe(true)
      })

      it('has provider notes', () => {
        const access = getPlanAccess('concierge')
        expect(access?.providerNotes).toBe(true)
      })

      it('does not have custom requests', () => {
        const access = getPlanAccess('concierge')
        expect(access?.customRequests).toBe(false)
      })
    })

    describe('Club tier ($499)', () => {
      it('has all features', () => {
        const access = getPlanAccess('club')
        expect(access?.masterIndex).toBe('full')
        expect(access?.advancedProtocols).toBe(true)
        expect(access?.dosingCalculators).toBe(true)
        expect(access?.stackingGuides).toBe(true)
        expect(access?.providerNotes).toBe(true)
        expect(access?.customRequests).toBe(true)
      })
    })
  })

  describe('Tier Access Matrix', () => {
    // Test the complete access matrix from the test plan
    const accessMatrix: Array<{
      tier: string
      masterIndex: 'full' | 'titles_only'
      advancedProtocols: boolean
      dosingCalculators: boolean
      stackingGuides: boolean
      providerNotes: boolean
      customRequests: boolean
    }> = [
      { tier: 'core', masterIndex: 'titles_only', advancedProtocols: false, dosingCalculators: false, stackingGuides: false, providerNotes: false, customRequests: false },
      { tier: 'creator', masterIndex: 'full', advancedProtocols: true, dosingCalculators: false, stackingGuides: false, providerNotes: false, customRequests: false },
      { tier: 'catalyst', masterIndex: 'full', advancedProtocols: true, dosingCalculators: true, stackingGuides: true, providerNotes: false, customRequests: false },
      { tier: 'concierge', masterIndex: 'full', advancedProtocols: true, dosingCalculators: true, stackingGuides: true, providerNotes: true, customRequests: false },
      { tier: 'club', masterIndex: 'full', advancedProtocols: true, dosingCalculators: true, stackingGuides: true, providerNotes: true, customRequests: true },
    ]

    for (const expected of accessMatrix) {
      it(`${expected.tier} tier has correct access`, () => {
        const plan = PLANS.find((p) => p.slug === expected.tier)
        const access = plan?.libraryAccess

        expect(access?.masterIndex).toBe(expected.masterIndex)
        expect(access?.advancedProtocols).toBe(expected.advancedProtocols)
        expect(access?.dosingCalculators).toBe(expected.dosingCalculators)
        expect(access?.stackingGuides).toBe(expected.stackingGuides)
        expect(access?.providerNotes).toBe(expected.providerNotes)
        expect(access?.customRequests).toBe(expected.customRequests)
      })
    }
  })

  describe('STRIPE_CONFIG', () => {
    it('has customer portal configuration', () => {
      expect(STRIPE_CONFIG.customerPortalId).toBeTruthy()
      expect(STRIPE_CONFIG.customerPortalUrl).toBeTruthy()
    })

    it('has coupon codes', () => {
      expect(STRIPE_CONFIG.coupons.FOUNDER15).toBeTruthy()
      expect(STRIPE_CONFIG.coupons.FIRSTMONTH).toBeTruthy()
    })
  })
})
