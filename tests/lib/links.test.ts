import { afterEach, describe, expect, it } from 'vitest'

import {
  getClinicalIntakeUrl,
  getConsultationBookingUrl,
  getJoinCheckoutUrl,
  getJoinSiteUrl,
} from '@/lib/config/links'

const ORIGINAL_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL
const ORIGINAL_INTAKE_URL = process.env.NEXT_PUBLIC_INTAKE_FORM_URL
const ORIGINAL_BOOKING_URL = process.env.NEXT_PUBLIC_CONSULTATION_BOOKING_URL

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name]
    return
  }

  process.env[name] = value
}

afterEach(() => {
  restoreEnv('NEXT_PUBLIC_SITE_URL', ORIGINAL_SITE_URL)
  restoreEnv('NEXT_PUBLIC_INTAKE_FORM_URL', ORIGINAL_INTAKE_URL)
  restoreEnv('NEXT_PUBLIC_CONSULTATION_BOOKING_URL', ORIGINAL_BOOKING_URL)
})

describe('join link helpers', () => {
  it('routes paid checkout links through the join domain when the main site is staging', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://staging.cultrhealth.com'

    expect(getJoinSiteUrl()).toBe('https://join.cultrhealth.com')
    expect(getJoinCheckoutUrl('catalyst')).toBe('https://join.cultrhealth.com/join/catalyst')
  })

  it('preserves the selected core therapy in the checkout url', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://staging.cultrhealth.com'

    expect(
      getJoinCheckoutUrl('core', { therapySlug: 'semaglutide' })
    ).toBe('https://join.cultrhealth.com/join/core?therapy=semaglutide')
  })
})

describe('clinical workflow links', () => {
  it('returns null when external workflow urls are not configured', () => {
    delete process.env.NEXT_PUBLIC_INTAKE_FORM_URL
    delete process.env.NEXT_PUBLIC_CONSULTATION_BOOKING_URL

    expect(getClinicalIntakeUrl()).toBeNull()
    expect(getConsultationBookingUrl()).toBeNull()
  })

  it('returns configured external workflow urls when present', () => {
    process.env.NEXT_PUBLIC_INTAKE_FORM_URL = 'https://intake.example.com/form'
    process.env.NEXT_PUBLIC_CONSULTATION_BOOKING_URL = 'https://schedule.example.com/book'

    expect(getClinicalIntakeUrl()).toBe('https://intake.example.com/form')
    expect(getConsultationBookingUrl()).toBe('https://schedule.example.com/book')
  })
})
