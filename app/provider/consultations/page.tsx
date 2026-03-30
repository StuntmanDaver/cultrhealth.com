import { getSession } from '@/lib/auth'
import { ProviderConsultationsClient } from './ProviderConsultationsClient'

export const metadata = { title: 'Provider Schedule — CULTR Health' }

export default async function ProviderConsultationsPage() {
  const session = await getSession()
  return <ProviderConsultationsClient providerEmail={session!.email} />
}
