import { getSession } from '@/lib/auth'
import { ProviderDashboardClient } from './ProviderDashboardClient'

export const metadata = {
  title: 'Provider Dashboard — CULTR Health',
}

export default async function ProviderDashboardPage() {
  const session = await getSession()
  return <ProviderDashboardClient providerEmail={session!.email} />
}
