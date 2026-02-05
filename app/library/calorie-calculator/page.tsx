import { redirect } from 'next/navigation'
import { getSession, getMembershipTier, hasFeatureAccess } from '@/lib/auth'
import { CalorieCalculatorClient } from './CalorieCalculatorClient'

export const metadata = {
  title: 'Calorie & Macro Calculator | CULTR Health',
  description: 'Advanced calorie and macronutrient calculator with multiple BMR formulas, activity tracking, and goal-based adjustments.',
}

export default async function CalorieCalculatorPage() {
  const session = await getSession()

  if (!session) {
    redirect('/library?error=login_required')
  }

  const tier = await getMembershipTier(session.customerId)

  // Require catalyst+ tier (same as dosing calculators)
  if (!hasFeatureAccess(tier, 'dosingCalculators')) {
    redirect('/pricing?upgrade=catalyst')
  }

  return <CalorieCalculatorClient email={session.email} />
}
