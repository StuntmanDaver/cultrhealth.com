import { redirect } from 'next/navigation'
import { getSession, getMembershipTier, hasFeatureAccess } from '@/lib/auth'
import { CartClient } from './CartClient'
import { PaymentProviderLoader } from '@/components/payments/PaymentProviderLoader'

export const metadata = {
  title: 'Cart | CULTR Health',
  description: 'Review your cart and submit a quote request.',
}

export default async function CartPage() {
  const session = await getSession()

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/library?error=login_required')
  }

  const tier = await getMembershipTier(session.customerId)

  // Check if user has access (catalyst+ tier)
  if (!hasFeatureAccess(tier, 'dosingCalculators')) {
    redirect('/pricing?upgrade=catalyst')
  }

  // PaymentProviderLoader only loads Klarna/Affirm SDKs on checkout pages
  return (
    <PaymentProviderLoader>
      <CartClient email={session.email} tier={tier} />
    </PaymentProviderLoader>
  )
}
