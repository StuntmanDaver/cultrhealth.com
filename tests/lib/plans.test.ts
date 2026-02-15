import { describe, it, expect } from 'vitest'
import { PLANS, STRIPE_CONFIG } from '@/lib/config/plans'
import type { PlanTier, LibraryAccess } from '@/lib/config/plans'

describe('Plans Configuration', () => {
  describe('PLANS array', () => {
    it('contains 4 tiers', () => {
      expect(PLANS).toHaveLength(4)
    })

    it('has expected tier slugs', () => {
      const slugs = PLANS.map((p) => p.slug)
      expect(slugs).toContain('club')
      expect(slugs).toContain('core')
      expect(slugs).toContain('catalyst')
      expect(slugs).toContain('concierge')
    })

    it('has ascending prices for paid plans', () => {
      const paidPlans = PLANS.filter((p) => p.price > 0)
      const prices = paidPlans.map((p) => p.price)
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThan(prices[i - 1])
      }
    })

    it('Club tier is free', () => {
      const club = PLANS.find((p) => p.slug === 'club')
      expect(club?.price).toBe(0)
    })

    it('each paid plan has required fields', () => {
      const paidPlans = PLANS.filter((p) => p.price > 0)
      for (const plan of paidPlans) {
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

    describe('Club tier ($0)', () => {
      it('has full master index', () => {
        const access = getPlanAccess('club')
        expect(access?.masterIndex).toBe('full')
      })

      it('does not have advanced protocols (no shop access)', () => {
        const access = getPlanAccess('club')
        expect(access?.advancedProtocols).toBe(false)
      })

      it('has dosing calculators', () => {
        const access = getPlanAccess('club')
        expect(access?.dosingCalculators).toBe(true)
      })

      it('has stacking guides', () => {
        const access = getPlanAccess('club')
        expect(access?.stackingGuides).toBe(true)
      })

      it('does not have provider notes', () => {
        const access = getPlanAccess('club')
        expect(access?.providerNotes).toBe(false)
      })

      it('does not have custom requests', () => {
        const access = getPlanAccess('club')
        expect(access?.customRequests).toBe(false)
      })
    })

    describe('Core tier ($199)', () => {
      it('has full master index', () => {
        const access = getPlanAccess('core')
        expect(access?.masterIndex).toBe('full')
      })

      it('has advanced protocols (shop access)', () => {
        const access = getPlanAccess('core')
        expect(access?.advancedProtocols).toBe(true)
      })

      it('has dosing calculators', () => {
        const access = getPlanAccess('core')
        expect(access?.dosingCalculators).toBe(true)
      })

      it('has stacking guides', () => {
        const access = getPlanAccess('core')
        expect(access?.stackingGuides).toBe(true)
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

    describe('Catalyst+ tier ($499)', () => {
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

    describe('Concierge tier ($1099)', () => {
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
  })

  describe('Tier Access Matrix', () => {
    const accessMatrix: Array<{
      tier: string
      masterIndex: 'full' | 'titles_only'
      advancedProtocols: boolean
      dosingCalculators: boolean
      stackingGuides: boolean
      providerNotes: boolean
      customRequests: boolean
    }> = [
      { tier: 'club', masterIndex: 'full', advancedProtocols: false, dosingCalculators: true, stackingGuides: true, providerNotes: false, customRequests: false },
      { tier: 'core', masterIndex: 'full', advancedProtocols: true, dosingCalculators: true, stackingGuides: true, providerNotes: false, customRequests: false },
      { tier: 'catalyst', masterIndex: 'full', advancedProtocols: true, dosingCalculators: true, stackingGuides: true, providerNotes: false, customRequests: false },
      { tier: 'concierge', masterIndex: 'full', advancedProtocols: true, dosingCalculators: true, stackingGuides: true, providerNotes: true, customRequests: false },
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
