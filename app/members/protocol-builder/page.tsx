import { redirect } from 'next/navigation'
import { getSession, isProviderEmail, getMembershipTier } from '@/lib/auth'
import { ProtocolBuilderClient } from '../../provider/protocol-builder/ProtocolBuilderClient'

export const metadata = { title: 'Protocol Builder — CULTR Health' }

export default async function LibraryProtocolBuilderPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const tier = session.customerId
    ? await getMembershipTier(session.customerId, session.email)
    : null
  const isProvider = isProviderEmail(session.email)
  const mode = (isProvider || tier === 'catalyst' || tier === 'concierge') ? 'full' : 'browse'

  return <ProtocolBuilderClient email={session.email} mode={mode} tier={tier} isProvider={isProvider} />
}
