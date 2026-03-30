import { redirect } from 'next/navigation'
import { getSession, isProviderEmail } from '@/lib/auth'
import { ProviderConsultationsClient } from '../../provider/consultations/ProviderConsultationsClient'

export const metadata = { title: 'Provider Schedule — CULTR Health' }

export default async function LibraryProviderSchedulePage() {
  const session = await getSession()

  if (!session) redirect('/login')
  if (!isProviderEmail(session.email)) redirect('/members')

  return <ProviderConsultationsClient providerEmail={session.email} />
}
