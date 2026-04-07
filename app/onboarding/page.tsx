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
  searchParams: Promise<{ session_id?: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const params = await searchParams

  return (
    <OnboardingClient
      email={session.email}
      intakeSessionId={params.session_id || null}
    />
  )
}
