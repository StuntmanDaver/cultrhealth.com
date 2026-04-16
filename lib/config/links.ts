export const LINKS = {
  // Billing Portal (Stripe)
  stripeCustomerPortal: 'https://billing.stripe.com/p/login/4gM00igPh021086fle6J200',

  // Support
  supportEmail: 'support@cultrhealth.com',

  // Social Media
  instagram: 'https://instagram.com/cultrhealth',
  twitter: 'https://twitter.com/cultrhealth',
  tiktok: 'https://tiktok.com/@cultrhealth',
  youtube: 'https://youtube.com/@cultrhealth',

  // Internal Routes
  login: '/login',
  onboarding: '/onboarding',
  pricing: '/pricing',
  success: '/success',
  dashboard: '/dashboard',
  intake: '/intake',
  memberConsultations: '/members/consultations',
  members: '/members',

  // Portal Routes
  portalLogin: '/portal/login',
  portalDashboard: '/portal/dashboard',
}

const DEFAULT_JOIN_SITE_URL = 'https://cultrclub.com'
const DEFAULT_STAGING_JOIN_SITE_URL = 'https://staging.cultrclub.pages.dev'

function trimTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

export function getJoinSiteUrl(siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''): string {
  const normalizedSiteUrl = trimTrailingSlash(siteUrl)

  if (!normalizedSiteUrl || normalizedSiteUrl.includes('localhost')) {
    return DEFAULT_JOIN_SITE_URL
  }

  if (normalizedSiteUrl.includes('join.staging.cultrhealth.com')) {
    return DEFAULT_STAGING_JOIN_SITE_URL
  }

  if (normalizedSiteUrl.includes('join.cultrhealth.com')) {
    return DEFAULT_JOIN_SITE_URL
  }

  if (normalizedSiteUrl.includes('staging.cultrhealth.com')) {
    return DEFAULT_JOIN_SITE_URL
  }

  return DEFAULT_JOIN_SITE_URL
}

export function getJoinCheckoutUrl(
  tierSlug: string,
  options?: { therapySlug?: string | null }
): string {
  const checkoutUrl = new URL(`/join/${tierSlug}`, getJoinSiteUrl())

  if (options?.therapySlug) {
    checkoutUrl.searchParams.set('therapy', options.therapySlug)
  }

  return checkoutUrl.toString()
}

export function getClinicalIntakeUrl(): string | null {
  const intakeUrl = process.env.NEXT_PUBLIC_INTAKE_FORM_URL?.trim()
  return intakeUrl ? trimTrailingSlash(intakeUrl) : null
}

export function getConsultationBookingUrl(): string | null {
  const bookingUrl = process.env.NEXT_PUBLIC_CONSULTATION_BOOKING_URL?.trim()
  if (!bookingUrl) {
    return null
  }

  const normalizedBookingUrl = trimTrailingSlash(bookingUrl)

  try {
    const parsedUrl = new URL(normalizedBookingUrl)
    const isHealthieBookingLink =
      parsedUrl.hostname.endsWith('gethealthie.com') &&
      parsedUrl.pathname.includes('/appointments/')
    const hasProviderFilter = Array.from(parsedUrl.searchParams.keys()).some((key) => {
      const normalizedKey = key.toLowerCase()
      return normalizedKey === 'provider_ids' || normalizedKey.startsWith('provider_ids[')
    })

    if (isHealthieBookingLink) {
      // Provider-filtered Healthie embeds need org-level scheduling to surface availability.
      if (hasProviderFilter) {
        parsedUrl.searchParams.set('org_level', 'true')
      }

      // Note: We used to unconditionally strip appt_type_ids here because stale type 
      // filters can hide newly configured schedulable types. However, if a URL
      // intentionally maintains appt_type_ids to restrict the provider's availability,
      // stripping them causes the widget to show org-level types with "(No availability)".
      // Per .cursorrules, we should only avoid HARDCODING them in the app code itself,
      // but if the user provides them via NEXT_PUBLIC_CONSULTATION_BOOKING_URL, we 
      // must preserve them.
    }

    return parsedUrl.toString()
  } catch {
    return normalizedBookingUrl
  }
}
