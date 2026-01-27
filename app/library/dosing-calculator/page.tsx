import { redirect } from 'next/navigation'
import { getSession, getMembershipTier, hasFeatureAccess } from '@/lib/auth'
import { DosingCalculatorClient } from './DosingCalculatorClient'

export const metadata = {
  title: 'Cultr Calculator | Peptide Dosing Calculator',
  description: 'Calculate peptide reconstitution and dosing with our precision calculator.',
}

export default async function DosingCalculatorPage() {
  const session = await getSession()

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/library?error=login_required')
  }

  const tier = await getMembershipTier(session.customerId)

  // Check if user has access to dosing calculators (catalyst+ tier)
  if (!hasFeatureAccess(tier, 'dosingCalculators')) {
    redirect('/pricing?upgrade=catalyst')
  }

  return <DosingCalculatorClient email={session.email} />
}
