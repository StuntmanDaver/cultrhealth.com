import { describe, expect, it } from 'vitest'

import { getAllJoinTherapies } from '@/lib/config/join-therapies'

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
})
