import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import OnboardingClient from './OnboardingClient'

export const metadata = {
  title: 'Welcome to CULTR Health — Get Started',
  description: 'Complete your onboarding to begin your personalized health protocol.',
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; next?: string }>
}) {
  const session = await getSession()
  const params = await searchParams

  if (!session) {
    let query = ''
    if (params.session_id) query += `session_id=${encodeURIComponent(params.session_id)}`
    if (params.next) query += `${query ? '&' : ''}next=${encodeURIComponent(params.next)}`
    
    const onboardingRedirectPath = query ? `/onboarding?${query}` : '/onboarding'
    redirect(`/login?redirect=${encodeURIComponent(onboardingRedirectPath)}`)
  }

  return (
    <OnboardingClient
      email={session.email}
      intakeSessionId={params.session_id || null}
      postIntakeStep={params.next || null}
    />
  )
}
