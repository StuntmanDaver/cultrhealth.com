import { redirect } from 'next/navigation'
import { getSession, getMembershipTier, hasFeatureAccess } from '@/lib/auth'
import { QuickOrderClient } from './QuickOrderClient'

export const metadata = {
  title: 'Quick Order | CULTR Health',
  description: 'Quick order peptides and compounds from our catalog.',
}

export default async function ShopPage() {
  const session = await getSession()

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/library?error=login_required')
  }

  const tier = await getMembershipTier(session.customerId)

  // Check if user has access to shop (catalyst+ tier - same as dosing calculators)
  if (!hasFeatureAccess(tier, 'dosingCalculators')) {
    redirect('/pricing?upgrade=catalyst')
  }

  return <QuickOrderClient email={session.email} tier={tier} />
}
