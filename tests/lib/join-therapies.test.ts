import { describe, expect, it } from 'vitest'

import { getAllJoinTherapies, normalizeJoinCartItems } from '@/lib/config/join-therapies'

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
})
