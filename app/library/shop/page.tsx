import { redirect } from 'next/navigation'
import { getSession, getMembershipTier, hasFeatureAccess } from '@/lib/auth'
import { ShopClient } from './ShopClient'

export const metadata = {
  title: 'Shop | CULTR Health',
  description: 'Browse our complete catalog of peptides and compounds.',
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

  return <ShopClient email={session.email} tier={tier} />
}
