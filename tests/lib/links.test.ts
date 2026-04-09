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

  it('adds org_level=true but PRESERVES appt_type_ids for Healthie booking links filtered by provider_ids', () => {
    process.env.NEXT_PUBLIC_CONSULTATION_BOOKING_URL =
      'https://secure.gethealthie.com/appointments/embed_appt?dietitian_id=13052862&provider_ids=%5B13052862%5D&appt_type_ids=%5B510493,510494%5D&primary_color=4A9625'

    expect(getConsultationBookingUrl()).toBe(
      'https://secure.gethealthie.com/appointments/embed_appt?dietitian_id=13052862&provider_ids=%5B13052862%5D&appt_type_ids=%5B510493%2C510494%5D&primary_color=4A9625&org_level=true'
    )
  })

  it('forces org_level=true when a Healthie link already includes org_level=false', () => {
    process.env.NEXT_PUBLIC_CONSULTATION_BOOKING_URL =
      'https://secure.gethealthie.com/appointments/embed_appt?provider_ids=%5B13052862%5D&org_level=false'

    const bookingUrl = getConsultationBookingUrl()

    expect(bookingUrl).not.toBeNull()
    expect(new URL(bookingUrl as string).searchParams.get('org_level')).toBe('true')
  })

  it('forces org_level=true for Healthie links using provider_ids[] keys', () => {
    process.env.NEXT_PUBLIC_CONSULTATION_BOOKING_URL =
      'https://secure.gethealthie.com/appointments/embed_appt?provider_ids%5B%5D=13052862'

    const bookingUrl = getConsultationBookingUrl()

    expect(bookingUrl).not.toBeNull()
    expect(new URL(bookingUrl as string).searchParams.get('org_level')).toBe('true')
  })

  it('preserves bracketed appt_type_ids[] params in Healthie booking links', () => {
    process.env.NEXT_PUBLIC_CONSULTATION_BOOKING_URL =
      'https://secure.gethealthie.com/appointments/embed_appt?provider_ids=%5B13052862%5D&appt_type_ids%5B%5D=510493&appt_type_ids%5B%5D=510494'

    const bookingUrl = getConsultationBookingUrl()

    expect(bookingUrl).not.toBeNull()
    const parsed = new URL(bookingUrl as string)
    const hasApptTypeIds = Array.from(parsed.searchParams.keys()).some((key) =>
      key.toLowerCase().startsWith('appt_type_ids')
    )
    expect(hasApptTypeIds).toBe(true)
  })
})
