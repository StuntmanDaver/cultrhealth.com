import { redirect } from 'next/navigation'
import { getSession, getMembershipTier, hasFeatureAccess } from '@/lib/auth'
import StackingGuidesClient from './StackingGuidesClient'

export const metadata = {
  title: 'Stacking Guides | CULTR Health',
  description: 'Goal-based peptide stacking protocols for fat loss, recovery, growth, and longevity optimization.',
}

export default async function StackingGuidesPage() {
  const session = await getSession()

  if (!session) {
    redirect('/members?error=login_required')
  }

  const tier = await getMembershipTier(session.customerId, session.email)

  if (!hasFeatureAccess(tier, 'stackingGuides')) {
    redirect('/pricing?upgrade=catalyst')
  }

  return <StackingGuidesClient />
}
