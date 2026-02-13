import { redirect } from 'next/navigation'
import { getSession, getMembershipTier } from '@/lib/auth'
import { PeptideFAQContent } from './PeptideFAQContent'

export const metadata = {
  title: 'Peptide FAQ — CULTR Health',
  description: 'Comprehensive peptide FAQ covering dosing, administration, reconstitution, safety, stacking, and more. Based on analysis of 5,774+ community discussions.',
}

export default async function PeptideFAQPage() {
  const session = await getSession()

  if (!session) {
    redirect('/library?error=login_required')
  }

  const tier = await getMembershipTier(session.customerId, session.email)

  return <PeptideFAQContent tier={tier} />
}
