import { describe, expect, it } from 'vitest'

import { getAllJoinTherapies, getJoinCouponPolicy, normalizeJoinCartItems } from '@/lib/config/join-therapies'

describe('Join therapies configuration', () => {
  it('matches the restored legacy join catalog', () => {
    const therapyIds = getAllJoinTherapies().map((therapy) => therapy.id)

    expect(therapyIds).toEqual([
      'retatrutide',
      'semaglutide',
      'tirzepatide',
      'ghk-cu',
      'glutathione',
      'tesa-ipa',
      'cjc1295-ipa',
      'nad-plus',
      'semax-selank',
      'bpc157-tb500',
      'melanotan-2',
      'igf1-lr3',
      'bacteriostatic-water',
    ])
  })

  it('rebuilds representative cart items from the current legacy catalog data', () => {
    expect(
      normalizeJoinCartItems([
        { therapyId: 'retatrutide', quantity: 1 },
        { therapyId: 'bacteriostatic-water', quantity: 4 },
      ])
    ).toEqual([
      {
        therapyId: 'retatrutide',
        name: 'R3TA — GLP1/GIP/GCG',
        price: 340,
        note: '20 MG | 3 ML · 2-3 month supply',
        quantity: 1,
      },
      {
        therapyId: 'bacteriostatic-water',
        name: 'Bacteriostatic Water',
        price: 29.99,
        note: '30 ML',
        quantity: 4,
      },
    ])
  })

  it('blocks coupons when the cart only contains bacteriostatic water', () => {
    expect(
      getJoinCouponPolicy([
        {
          therapyId: 'bacteriostatic-water',
          quantity: 2,
        },
      ])
    ).toEqual({
      couponAllowed: false,
      couponError: 'Coupons require another therapy in the cart. Bacteriostatic water alone is not eligible.',
      forceNoBundleStack: false,
    })
  })

  it('forces no-bundle-stacking for the ghk-cu and glutathione pair', () => {
    expect(
      getJoinCouponPolicy([
        {
          therapyId: 'ghk-cu',
          quantity: 1,
        },
        {
          therapyId: 'glutathione',
          quantity: 1,
        },
      ])
    ).toEqual({
      couponAllowed: true,
      couponError: null,
      forceNoBundleStack: true,
    })
  })
})
