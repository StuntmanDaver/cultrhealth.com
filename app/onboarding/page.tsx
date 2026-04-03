import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import OnboardingClient from './OnboardingClient'

export const metadata = {
  title: 'Welcome to CULTR Health — Get Started',
  description: 'Complete your onboarding to begin your personalized health protocol.',
}

export default async function OnboardingPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return <OnboardingClient email={session.email} />
}
